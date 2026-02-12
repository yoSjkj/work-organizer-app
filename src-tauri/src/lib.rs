use tauri::Manager;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};

mod commands;

use commands::data::{save_data, load_data, get_data_path};
use commands::backup::{backup_data, list_backups, restore_backup, check_and_auto_backup};
use commands::deployment::create_deployment_folders;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--hidden"]) // 숨김 모드로 시작
        ))
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 시스템 트레이 메뉴 생성
            let show_i = MenuItem::with_id(app, "show", "열기", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            // 트레이 아이콘 생성
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            // 창 닫기 이벤트 처리 (트레이로 숨기기)
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // 창을 닫지 않고 숨김
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            // 앱 시작 시 자동 백업 체크
            check_and_auto_backup(&app.handle());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_data,
            load_data,
            get_data_path,
            backup_data,
            list_backups,
            restore_backup,
            create_deployment_folders
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
