use std::fs;
use std::path::Path;

#[tauri::command]
pub fn create_deployment_folders(backup_path: String, new_path: String) -> Result<String, String> {
    // 백업 폴더 생성
    if let Err(e) = fs::create_dir_all(Path::new(&backup_path)) {
        return Err(format!("백업 폴더 생성 실패: {}", e));
    }

    // 신규 폴더 생성
    if let Err(e) = fs::create_dir_all(Path::new(&new_path)) {
        return Err(format!("신규 폴더 생성 실패: {}", e));
    }

    Ok(format!("폴더 생성 완료:\n{}\n{}", backup_path, new_path))
}
