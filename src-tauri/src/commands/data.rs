use std::fs;
use tauri::Manager;

#[tauri::command]
pub fn save_data(app: tauri::AppHandle, data: String) -> Result<(), String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    fs::create_dir_all(&app_dir)
        .map_err(|e| e.to_string())?;

    let data_file = app_dir.join("workItems.json");
    fs::write(data_file, data)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn load_data(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    let data_file = app_dir.join("workItems.json");

    if !data_file.exists() {
        return Ok(String::from("null"));
    }

    fs::read_to_string(data_file)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_data_path(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;

    Ok(app_dir.to_string_lossy().to_string())
}
