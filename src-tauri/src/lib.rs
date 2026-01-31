use tauri::{
    menu::{Menu, MenuItem, Submenu},
    tray::{TrayIconBuilder, MouseButton, MouseButtonState},
    Manager, Emitter,
};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState, GlobalShortcutExt};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        // Cmd+K - Quick add task
                        if shortcut.matches(Modifiers::SUPER, Code::KeyK) {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.emit("quick-add", ());
                            }
                        }
                        // Cmd+Shift+S - Show/focus app
                        if shortcut.matches(Modifiers::SUPER | Modifiers::SHIFT, Code::KeyS) {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register global shortcuts
            let shortcut_manager = app.global_shortcut();
            
            // Cmd+K for quick add
            let quick_add = Shortcut::new(Some(Modifiers::SUPER), Code::KeyK);
            shortcut_manager.register(quick_add)?;
            
            // Cmd+Shift+S to show app
            let show_app = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyS);
            shortcut_manager.register(show_app)?;

            // Build native menu
            let app_menu = Submenu::with_items(
                app,
                "Sashi",
                true,
                &[
                    &MenuItem::with_id(app, "about", "About Sashi", true, None::<&str>)?,
                    &MenuItem::with_id(app, "separator1", "", false, None::<&str>)?,
                    &MenuItem::with_id(app, "preferences", "Settings...", true, Some("CmdOrCtrl+,"))?,
                    &MenuItem::with_id(app, "separator2", "", false, None::<&str>)?,
                    &MenuItem::with_id(app, "hide", "Hide Sashi", true, Some("CmdOrCtrl+H"))?,
                    &MenuItem::with_id(app, "quit", "Quit Sashi", true, Some("CmdOrCtrl+Q"))?,
                ],
            )?;

            let file_menu = Submenu::with_items(
                app,
                "File",
                true,
                &[
                    &MenuItem::with_id(app, "new_task", "New Task", true, Some("CmdOrCtrl+N"))?,
                    &MenuItem::with_id(app, "quick_add", "Quick Add...", true, Some("CmdOrCtrl+K"))?,
                ],
            )?;

            let edit_menu = Submenu::with_items(
                app,
                "Edit",
                true,
                &[
                    &MenuItem::with_id(app, "undo", "Undo", true, Some("CmdOrCtrl+Z"))?,
                    &MenuItem::with_id(app, "redo", "Redo", true, Some("CmdOrCtrl+Shift+Z"))?,
                    &MenuItem::with_id(app, "separator3", "", false, None::<&str>)?,
                    &MenuItem::with_id(app, "cut", "Cut", true, Some("CmdOrCtrl+X"))?,
                    &MenuItem::with_id(app, "copy", "Copy", true, Some("CmdOrCtrl+C"))?,
                    &MenuItem::with_id(app, "paste", "Paste", true, Some("CmdOrCtrl+V"))?,
                    &MenuItem::with_id(app, "select_all", "Select All", true, Some("CmdOrCtrl+A"))?,
                ],
            )?;

            let view_menu = Submenu::with_items(
                app,
                "View",
                true,
                &[
                    &MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?,
                    &MenuItem::with_id(app, "toggle_devtools", "Developer Tools", true, Some("CmdOrCtrl+Alt+I"))?,
                    &MenuItem::with_id(app, "separator4", "", false, None::<&str>)?,
                    &MenuItem::with_id(app, "fullscreen", "Enter Full Screen", true, Some("Ctrl+CmdOrCtrl+F"))?,
                ],
            )?;

            let window_menu = Submenu::with_items(
                app,
                "Window",
                true,
                &[
                    &MenuItem::with_id(app, "minimize", "Minimize", true, Some("CmdOrCtrl+M"))?,
                    &MenuItem::with_id(app, "zoom", "Zoom", true, None::<&str>)?,
                    &MenuItem::with_id(app, "separator5", "", false, None::<&str>)?,
                    &MenuItem::with_id(app, "close", "Close", true, Some("CmdOrCtrl+W"))?,
                ],
            )?;

            let menu = Menu::with_items(
                app,
                &[&app_menu, &file_menu, &edit_menu, &view_menu, &window_menu],
            )?;

            app.set_menu(menu)?;

            // Handle menu events
            app.on_menu_event(move |app, event| {
                match event.id().as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "new_task" | "quick_add" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("quick-add", ());
                        }
                    }
                    "preferences" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("open-settings", ());
                        }
                    }
                    "reload" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("location.reload()");
                        }
                    }
                    "toggle_devtools" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_devtools_open() {
                                window.close_devtools();
                            } else {
                                window.open_devtools();
                            }
                        }
                    }
                    "minimize" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.minimize();
                        }
                    }
                    "close" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "fullscreen" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let is_fullscreen = window.is_fullscreen().unwrap_or(false);
                            let _ = window.set_fullscreen(!is_fullscreen);
                        }
                    }
                    _ => {}
                }
            });

            // Build system tray (menu bar icon)
            let tray_menu = Menu::with_items(
                app,
                &[
                    &MenuItem::with_id(app, "tray_show", "Show Sashi", true, None::<&str>)?,
                    &MenuItem::with_id(app, "tray_quick_add", "Quick Add Task", true, None::<&str>)?,
                    &MenuItem::with_id(app, "tray_separator", "", false, None::<&str>)?,
                    &MenuItem::with_id(app, "tray_quit", "Quit", true, None::<&str>)?,
                ],
            )?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "tray_show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "tray_quick_add" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.emit("quick-add", ());
                            }
                        }
                        "tray_quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button, button_state, .. } = event {
                        if button == MouseButton::Left && button_state == MouseButtonState::Up {
                            if let Some(window) = tray.app_handle().get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
