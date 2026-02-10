use chrono::{DateTime, Local, Duration};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// 백업 생성
#[tauri::command]
pub fn backup_data(app: tauri::AppHandle, is_manual: bool) -> Result<String, String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    let backup_dir = app_dir.join("backups");
    fs::create_dir_all(&backup_dir)
        .map_err(|e| e.to_string())?;

    let data_file = app_dir.join("workItems.json");
    if !data_file.exists() {
        return Err("No data to backup".to_string());
    }

    // 백업 파일명: backup_manual/auto_YYYYMMDD_HHMMSS.json
    let now = Local::now();
    let backup_type = if is_manual { "manual" } else { "auto" };
    let backup_filename = format!("backup_{}_{}.json", backup_type, now.format("%Y%m%d_%H%M%S"));
    let backup_file = backup_dir.join(&backup_filename);

    fs::copy(&data_file, &backup_file)
        .map_err(|e| e.to_string())?;

    // 자동 백업일 때만 마지막 백업 시간 기록
    if !is_manual {
        let last_backup_file = app_dir.join("last_backup.txt");
        fs::write(last_backup_file, now.to_rfc3339())
            .map_err(|e| e.to_string())?;
    }

    // 오래된 백업 정리 (자동 백업만)
    cleanup_old_backups(&backup_dir)?;

    Ok(backup_filename)
}

// 백업 목록 조회
#[tauri::command]
pub fn list_backups(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    let backup_dir = app_dir.join("backups");
    if !backup_dir.exists() {
        return Ok(Vec::new());
    }

    let mut backups = Vec::new();
    for entry in fs::read_dir(&backup_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let filename = entry.file_name().to_string_lossy().to_string();
        if filename.starts_with("backup_") && filename.ends_with(".json") {
            backups.push(filename);
        }
    }

    // 최신순 정렬
    backups.sort_by(|a, b| b.cmp(a));

    Ok(backups)
}

// 백업 복구
#[tauri::command]
pub fn restore_backup(app: tauri::AppHandle, backup_filename: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    let backup_file = app_dir.join("backups").join(&backup_filename);
    if !backup_file.exists() {
        return Err(format!("Backup file not found: {}", backup_filename));
    }

    let data_file = app_dir.join("workItems.json");

    // 복구 전 현재 데이터를 백업 (안전장치)
    if data_file.exists() {
        let now = Local::now();
        let safety_backup = app_dir.join("backups").join(
            format!("backup_before_restore_{}.json", now.format("%Y%m%d_%H%M%S"))
        );
        fs::copy(&data_file, &safety_backup)
            .map_err(|e| e.to_string())?;
    }

    // 백업 복구
    fs::copy(&backup_file, &data_file)
        .map_err(|e| e.to_string())?;

    Ok(())
}

// 7일 이상 된 자동 백업 삭제 (수동 백업은 보존)
fn cleanup_old_backups(backup_dir: &PathBuf) -> Result<(), String> {
    let now = Local::now();
    let seven_days_ago = now - Duration::days(7);

    for entry in fs::read_dir(backup_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        let filename = entry.file_name().to_string_lossy().to_string();

        // 수동 백업과 복구 전 안전 백업은 제외
        if filename.contains("manual") || filename.contains("before_restore") {
            continue;
        }

        // 자동 백업만 7일 후 삭제
        if filename.starts_with("backup_auto_") {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    let modified_datetime: DateTime<Local> = modified.into();
                    if modified_datetime < seven_days_ago {
                        let _ = fs::remove_file(path);
                    }
                }
            }
        }
    }

    Ok(())
}

// 앱 시작 시 자동 백업 체크
pub fn check_and_auto_backup(app: &tauri::AppHandle) {
    let app_dir = match app.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => return,
    };

    let data_file = app_dir.join("workItems.json");
    println!("Checking data file: {:?}", data_file);
    println!("Data file exists: {}", data_file.exists());

    let last_backup_file = app_dir.join("last_backup.txt");

    // 마지막 백업 시간 확인
    let should_backup = if last_backup_file.exists() {
        if let Ok(last_backup_str) = fs::read_to_string(&last_backup_file) {
            if let Ok(last_backup) = DateTime::parse_from_rfc3339(&last_backup_str) {
                let now = Local::now();
                let diff = now.signed_duration_since(last_backup);
                diff.num_hours() >= 24
            } else {
                true
            }
        } else {
            true
        }
    } else {
        true
    };

    if should_backup {
        println!("Auto backup: 24시간 경과, 백업 시작...");
        match backup_data(app.clone(), false) {
            Ok(_) => println!("Auto backup completed!"),
            Err(e) => {
                // 데이터가 없을 때는 조용히 넘어감
                if !e.contains("No data to backup") {
                    println!("Auto backup failed: {}", e);
                }
            }
        }
    }
}
