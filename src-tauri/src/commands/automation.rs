use tauri::{AppHandle, Emitter, Manager};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

// ── OTP 생성 (TOTP RFC 6238) ──────────────────────────────────────────────────

#[tauri::command]
pub fn generate_otp(secret: String) -> Result<String, String> {
    generate_totp(&secret)
}

fn generate_totp(secret: &str) -> Result<String, String> {
    use std::time::{SystemTime, UNIX_EPOCH};

    let secret_clean = secret
        .to_uppercase()
        .replace(' ', "")
        .replace('-', "");

    let key = base32_decode(&secret_clean)
        .map_err(|e| format!("Base32 디코딩 오류: {}", e))?;

    let time_step = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs()
        / 30;

    let code = hotp_sha1(&key, time_step, 6)?;
    Ok(format!("{:06}", code))
}

fn hotp_sha1(key: &[u8], counter: u64, digits: u32) -> Result<u32, String> {
    let msg = counter.to_be_bytes();
    let hmac = hmac_sha1(key, &msg);

    let offset = (hmac[19] & 0x0f) as usize;
    let code = ((hmac[offset] as u32 & 0x7f) << 24)
        | ((hmac[offset + 1] as u32) << 16)
        | ((hmac[offset + 2] as u32) << 8)
        | (hmac[offset + 3] as u32);

    let modulus = 10u32.pow(digits);
    Ok(code % modulus)
}

fn hmac_sha1(key: &[u8], msg: &[u8]) -> [u8; 20] {
    const BLOCK_SIZE: usize = 64;

    let mut k = [0u8; BLOCK_SIZE];
    if key.len() > BLOCK_SIZE {
        let h = sha1(key);
        k[..20].copy_from_slice(&h);
    } else {
        k[..key.len()].copy_from_slice(key);
    }

    let mut ipad = [0u8; BLOCK_SIZE];
    let mut opad = [0u8; BLOCK_SIZE];
    for i in 0..BLOCK_SIZE {
        ipad[i] = k[i] ^ 0x36;
        opad[i] = k[i] ^ 0x5c;
    }

    let inner = {
        let mut data = ipad.to_vec();
        data.extend_from_slice(msg);
        sha1(&data)
    };
    let outer = {
        let mut data = opad.to_vec();
        data.extend_from_slice(&inner);
        sha1(&data)
    };
    outer
}

fn sha1(data: &[u8]) -> [u8; 20] {
    let mut h: [u32; 5] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

    let mut padded = data.to_vec();
    let bit_len = (data.len() as u64) * 8;
    padded.push(0x80);
    while padded.len() % 64 != 56 {
        padded.push(0);
    }
    padded.extend_from_slice(&bit_len.to_be_bytes());

    for chunk in padded.chunks(64) {
        let mut w = [0u32; 80];
        for i in 0..16 {
            w[i] = u32::from_be_bytes([chunk[i * 4], chunk[i * 4 + 1], chunk[i * 4 + 2], chunk[i * 4 + 3]]);
        }
        for i in 16..80 {
            w[i] = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]).rotate_left(1);
        }

        let (mut a, mut b, mut c, mut d, mut e) = (h[0], h[1], h[2], h[3], h[4]);

        for i in 0..80 {
            let (f, k) = match i {
                0..=19  => ((b & c) | ((!b) & d), 0x5A827999u32),
                20..=39 => (b ^ c ^ d, 0x6ED9EBA1u32),
                40..=59 => ((b & c) | (b & d) | (c & d), 0x8F1BBCDCu32),
                _       => (b ^ c ^ d, 0xCA62C1D6u32),
            };
            let temp = a.rotate_left(5).wrapping_add(f).wrapping_add(e).wrapping_add(k).wrapping_add(w[i]);
            e = d; d = c; c = b.rotate_left(30); b = a; a = temp;
        }

        h[0] = h[0].wrapping_add(a);
        h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c);
        h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e);
    }

    let mut out = [0u8; 20];
    for (i, &v) in h.iter().enumerate() {
        out[i * 4..(i + 1) * 4].copy_from_slice(&v.to_be_bytes());
    }
    out
}

fn base32_decode(s: &str) -> Result<Vec<u8>, String> {
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let mut bits = 0u32;
    let mut bit_count = 0u32;
    let mut out = Vec::new();

    for c in s.bytes() {
        if c == b'=' { break; }
        let val = ALPHABET
            .iter()
            .position(|&x| x == c)
            .ok_or_else(|| format!("유효하지 않은 Base32 문자: {}", c as char))? as u32;
        bits = (bits << 5) | val;
        bit_count += 5;
        if bit_count >= 8 {
            bit_count -= 8;
            out.push((bits >> bit_count) as u8);
            bits &= (1 << bit_count) - 1;
        }
    }
    Ok(out)
}

// ── Config 관리 ───────────────────────────────────────────────────────────────

/// automation-config.json을 기본 편집기로 열기 (없으면 템플릿 생성)
#[tauri::command]
pub fn open_automation_config_file(app: AppHandle) -> Result<(), String> {
    use std::fs;
    use tauri_plugin_opener::OpenerExt;

    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let config_file = app_dir.join("automation-config.json");

    if !config_file.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
        let template = r##"{
  "_설명": "자동화 설정 파일. 실제 값을 채워서 사용하세요.",
  "_주의": "자동화 실행 전 Chrome을 완전히 종료해야 합니다.",
  "chromeUserData": "",
  "_chromeUserData_설명": "비워두면 기본 경로 사용 (C:/Users/{사용자}/AppData/Local/Google/Chrome/User Data)",
  "sso":      { "url": "", "username": "", "password": "", "selectors": { "username": "input[name='username']", "password": "input[name='password']", "loginButton": "button[type='submit']" } },
  "itsm":     { "url": "", "username": "", "password": "", "otpSecret": "", "selectors": { "username": "input[name='user_name']", "password": "input[name='user_password']", "loginButton": "#sysverb_login", "otpInput": "input[name='answer']", "otpButton": "button[type='submit']" } },
  "aws":      { "url": "", "username": "", "password": "", "selectors": { "username": "input[name='username']", "password": "input[name='password']", "loginButton": "button[type='submit']" } },
  "external": { "url": "", "username": "", "password": "", "selectors": { "username": "#LoginID", "password": "#LoginPassword", "loginButton": "button.login-btn", "ucloudCheckbox": "#CHECKED_VM_AUTO_CONNECT" } }
}
"##;
        fs::write(&config_file, template).map_err(|e| e.to_string())?;
    }

    app.opener()
        .open_path(config_file.to_str().unwrap_or(""), None::<&str>)
        .map_err(|e| e.to_string())
}

/// AppData 디렉토리에서 automation-config.json 읽기
#[tauri::command]
pub fn get_automation_config(app: AppHandle) -> Result<serde_json::Value, String> {
    use std::fs;

    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let config_file = app_dir.join("automation-config.json");

    if !config_file.exists() {
        return Err(format!(
            "automation-config.json 파일이 없습니다.\n경로: {}",
            config_file.display()
        ));
    }

    let text = fs::read_to_string(&config_file).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

// ── 프로세스 레지스트리 ────────────────────────────────────────────────────────

pub struct ProcessRegistry(pub Mutex<HashMap<String, u32>>);

impl ProcessRegistry {
    pub fn new() -> Self {
        ProcessRegistry(Mutex::new(HashMap::new()))
    }
}

// ── 자동화 실행/중지 ──────────────────────────────────────────────────────────

#[derive(Clone, serde::Serialize)]
pub struct AutomationLog {
    pub task: String,
    pub level: String,
    pub message: String,
}

/// automation/ 폴더 경로 탐색
/// - 디버그 빌드: CARGO_MANIFEST_DIR 기준 (프로젝트 루트/automation)
/// - 릴리즈 빌드: exe 폴더 옆의 automation/
fn get_automation_dir(_app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    {
        let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .ok_or_else(|| "src-tauri 부모 폴더 없음".to_string())?
            .join("automation");
        if dir.exists() {
            return Ok(dir);
        }
    }

    // 릴리즈: exe 폴더 옆의 automation/
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "exe 폴더 없음".to_string())?;
    let dir = exe_dir.join("automation");

    if dir.exists() {
        Ok(dir)
    } else {
        Err(format!(
            "automation 폴더를 찾을 수 없습니다.\n경로: {}\nNode.js(nodejs.org)와 automation 폴더가 필요합니다.",
            dir.display()
        ))
    }
}

fn get_script_path(automation_dir: &PathBuf, task: &str) -> Result<PathBuf, String> {
    let filename = match task {
        "itsm"     => "itsm-daily.js",
        "external" => "external-net.js",
        _ => return Err(format!("알 수 없는 task: {}", task)),
    };
    let path = automation_dir.join("scripts").join(filename);
    if path.exists() {
        Ok(path)
    } else {
        Err(format!("스크립트 없음: {}", path.display()))
    }
}

fn get_monitoring_script_path(automation_dir: &PathBuf, task: &str) -> Result<PathBuf, String> {
    let filename = match task {
        "csr"  => "csr-monitor.js",
        "mail" => "mail-monitor.js",
        _ => return Err(format!("알 수 없는 모니터링 task: {}", task)),
    };
    let path = automation_dir.join("scripts").join(filename);
    if path.exists() {
        Ok(path)
    } else {
        Err(format!("스크립트 없음: {}", path.display()))
    }
}

// ── 모니터링 실행/중지 ─────────────────────────────────────────────────────────

#[derive(Clone, serde::Serialize)]
pub struct MonitoringEvent {
    pub task: String,
    pub line: String, // csr-monitor.js / mail-monitor.js 의 JSON Lines 출력 그대로
}

// PID 파일 경로: {AppData}/monitor-{task}.pid
fn pid_file_path(app: &AppHandle, task: &str) -> Option<std::path::PathBuf> {
    app.path().app_data_dir().ok().map(|d| d.join(format!("monitor-{}.pid", task)))
}

// PID 파일에서 읽어 프로세스 트리 kill, 파일 삭제
fn kill_from_pid_file(app: &AppHandle, task: &str) {
    if let Some(path) = pid_file_path(app, task) {
        if let Ok(s) = std::fs::read_to_string(&path) {
            if let Ok(pid) = s.trim().parse::<u32>() {
                kill_process_tree(pid);
            }
        }
        let _ = std::fs::remove_file(&path);
    }
}

// PID 파일 저장
fn save_pid_file(app: &AppHandle, task: &str, pid: u32) {
    if let Some(path) = pid_file_path(app, task) {
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(&path, pid.to_string());
    }
}

/// CSR/메일 모니터링 프로세스 실행
/// stdout(JSON Lines) → "monitoring-event" 이벤트로 프론트에 전달
/// PID는 ProcessRegistry + PID 파일에 등록 → 앱 재시작 후에도 중복 실행 방지
#[tauri::command]
pub async fn run_monitoring(
    app: AppHandle,
    task: String,
    config: serde_json::Value,
) -> Result<(), String> {
    use tokio::io::AsyncBufReadExt;
    use tokio::process::Command;

    let automation_dir = get_automation_dir(&app)?;
    let script_path = get_monitoring_script_path(&automation_dir, &task)?;
    let full_config_json = serde_json::to_string(&config).map_err(|e| e.to_string())?;

    // 이전 세션 고아 프로세스 정리 (PID 파일 기반)
    kill_from_pid_file(&app, &task);

    // 현재 세션 레지스트리에 남아있는 경우도 정리
    {
        let registry = app.state::<ProcessRegistry>();
        let existing_pid = registry.0.lock().unwrap().remove(&task);
        if let Some(pid) = existing_pid {
            kill_process_tree(pid);
        }
    }

    let mut child = Command::new("node")
        .arg(script_path.to_str().unwrap_or(""))
        .env("FULL_CONFIG", &full_config_json)
        .current_dir(&automation_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "Node.js를 찾을 수 없습니다. nodejs.org 에서 설치하세요.".to_string()
            } else {
                format!("프로세스 실행 실패: {}", e)
            }
        })?;

    let pid = child.id().unwrap_or(0);
    {
        let registry = app.state::<ProcessRegistry>();
        registry.0.lock().unwrap().insert(task.clone(), pid);
    }
    // PID 파일 저장 (앱 재시작 후 고아 프로세스 정리용)
    save_pid_file(&app, &task, pid);

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // stdout: JSON Lines 그대로 전달
    let app_out = app.clone();
    let task_out = task.clone();
    tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stdout).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app_out.emit("monitoring-event", MonitoringEvent {
                task: task_out.clone(),
                line,
            });
        }
    });

    // stderr: log 이벤트로 래핑
    let app_err = app.clone();
    let task_err = task.clone();
    tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            if !line.trim().is_empty() {
                let ts = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_millis() as u64)
                    .unwrap_or(0);
                let json = serde_json::json!({
                    "type": "log",
                    "message": format!("[오류] {}", line),
                    "ts": ts
                }).to_string();
                let _ = app_err.emit("monitoring-event", MonitoringEvent {
                    task: task_err.clone(),
                    line: json,
                });
            }
        }
    });

    // 종료 처리: done 이벤트 + ProcessRegistry + PID 파일 정리
    let app_wait = app.clone();
    let task_wait = task.clone();
    tokio::spawn(async move {
        if let Ok(status) = child.wait().await {
            {
                let registry = app_wait.state::<ProcessRegistry>();
                registry.0.lock().unwrap().remove(&task_wait);
            }
            // PID 파일에 우리 PID가 그대로 있을 때만 삭제 (새 프로세스의 파일을 건드리지 않음)
            if let Some(path) = pid_file_path(&app_wait, &task_wait) {
                if let Ok(s) = std::fs::read_to_string(&path) {
                    if s.trim().parse::<u32>().ok() == Some(pid) {
                        let _ = std::fs::remove_file(&path);
                    }
                }
            }
            let ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);
            let json = serde_json::json!({
                "type": "done",
                "code": status.code().unwrap_or(-1),
                "ts": ts
            }).to_string();
            let _ = app_wait.emit("monitoring-event", MonitoringEvent {
                task: task_wait,
                line: json,
            });
        }
    });

    Ok(())
}

/// CSR/메일 모니터링 중지 (stop_automation과 동일 로직, ProcessRegistry 공유)
#[tauri::command]
pub async fn stop_monitoring(app: AppHandle, task: String) -> Result<(), String> {
    let pid = {
        let registry = app.state::<ProcessRegistry>();
        let result = registry.0.lock().unwrap().remove(&task);
        result
    };

    if let Some(pid) = pid {
        kill_process_tree(pid);
    }

    // PID 파일 기반으로도 정리 (레지스트리에 없는 고아 프로세스 대비)
    kill_from_pid_file(&app, &task);

    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    let json = serde_json::json!({
        "type": "done",
        "code": -1,
        "ts": ts
    }).to_string();
    let _ = app.emit("monitoring-event", MonitoringEvent {
        task,
        line: json,
    });

    Ok(())
}

fn classify_log_level(line: &str) -> &'static str {
    if line.contains("✅") || line.contains("완료") || line.contains("성공") {
        "success"
    } else if line.contains("❌") || line.contains("오류") || line.contains("Error:") || line.contains("error:") {
        "error"
    } else {
        "info"
    }
}

#[cfg(windows)]
fn kill_process_tree(pid: u32) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    let _ = std::process::Command::new("taskkill")
        .args(["/F", "/T", "/PID", &pid.to_string()])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn();
}

#[cfg(not(windows))]
fn kill_process_tree(pid: u32) {
    let _ = std::process::Command::new("kill")
        .args(["-TERM", &pid.to_string()])
        .spawn();
}

#[tauri::command]
pub async fn run_automation(
    app: AppHandle,
    task: String,
    config: serde_json::Value,
) -> Result<(), String> {
    use tokio::io::AsyncBufReadExt;
    use tokio::process::Command;

    let automation_dir = get_automation_dir(&app)?;
    let script_path = get_script_path(&automation_dir, &task)?;

    // config가 비어 있으면 automation/config.json 파일에서 읽기
    let effective_config = if config.as_object().map(|o| o.is_empty()).unwrap_or(true) {
        let config_file = automation_dir.join("config.json");
        let text = std::fs::read_to_string(&config_file)
            .map_err(|_| format!("config.json 없음: {}", config_file.display()))?;
        serde_json::from_str(&text).map_err(|e| e.to_string())?
    } else {
        config
    };
    let full_config_json = serde_json::to_string(&effective_config).map_err(|e| e.to_string())?;

    let _ = app.emit("automation-log", AutomationLog {
        task: task.clone(),
        level: "info".to_string(),
        message: format!("▶ 시작: {}", script_path.file_name().unwrap_or_default().to_string_lossy()),
    });

    let mut child = Command::new("node")
        .arg(script_path.to_str().unwrap_or(""))
        .env("FULL_CONFIG", &full_config_json)
        .current_dir(&automation_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "Node.js를 찾을 수 없습니다. nodejs.org 에서 설치하세요.".to_string()
            } else {
                format!("프로세스 실행 실패: {}", e)
            }
        })?;

    // PID 등록
    let pid = child.id().unwrap_or(0);
    {
        let registry = app.state::<ProcessRegistry>();
        registry.0.lock().unwrap().insert(task.clone(), pid);
    }

    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    // stdout 스트리밍
    let app_out = app.clone();
    let task_out = task.clone();
    tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stdout).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let level = classify_log_level(&line);
            let _ = app_out.emit("automation-log", AutomationLog {
                task: task_out.clone(),
                level: level.to_string(),
                message: line,
            });
        }
    });

    // stderr 스트리밍
    let app_err = app.clone();
    let task_err = task.clone();
    tokio::spawn(async move {
        let mut lines = tokio::io::BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app_err.emit("automation-log", AutomationLog {
                task: task_err.clone(),
                level: "error".to_string(),
                message: line,
            });
        }
    });

    // 프로세스 완료 대기
    let app_wait = app.clone();
    let task_wait = task.clone();
    tokio::spawn(async move {
        match child.wait().await {
            Ok(status) => {
                {
                    let registry = app_wait.state::<ProcessRegistry>();
                    registry.0.lock().unwrap().remove(&task_wait);
                }
                let (level, msg) = if status.success() {
                    ("success", "✅ 완료".to_string())
                } else {
                    ("error", format!("❌ 종료 (코드: {})", status.code().unwrap_or(-1)))
                };
                let _ = app_wait.emit("automation-log", AutomationLog {
                    task: task_wait,
                    level: level.to_string(),
                    message: msg,
                });
            }
            Err(e) => {
                let _ = app_wait.emit("automation-log", AutomationLog {
                    task: task_wait,
                    level: "error".to_string(),
                    message: format!("대기 오류: {}", e),
                });
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_automation(app: AppHandle, task: String) -> Result<(), String> {
    let pid = {
        let registry = app.state::<ProcessRegistry>();
        let result = registry.0.lock().unwrap().remove(&task);
        result
    };

    if let Some(pid) = pid {
        kill_process_tree(pid);
    }

    let _ = app.emit("automation-log", AutomationLog {
        task: task.clone(),
        level: "info".to_string(),
        message: "⏹ 중지됨".to_string(),
    });
    Ok(())
}

/// automation 폴더 절대경로 반환 (JS에서 Command cwd로 사용)
#[tauri::command]
pub fn get_automation_dir_path(app: AppHandle) -> Result<String, String> {
    let dir = get_automation_dir(&app)?;
    Ok(dir.to_string_lossy().to_string())
}

/// 현재 실행 중인 task 목록 반환
#[tauri::command]
pub fn get_open_tasks(app: AppHandle) -> Vec<String> {
    let registry = app.state::<ProcessRegistry>();
    let tasks: Vec<String> = registry.0.lock().unwrap().keys().cloned().collect();
    tasks
}
