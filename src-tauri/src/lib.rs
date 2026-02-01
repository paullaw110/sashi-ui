use tauri::{
    menu::{Menu, MenuItem, Submenu},
    tray::{TrayIconBuilder, MouseButton, MouseButtonState},
    Manager, Emitter, AppHandle,
};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState, GlobalShortcutExt};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};

// Track online status
static IS_ONLINE: AtomicBool = AtomicBool::new(true);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub name: String,
    pub status: String,
    pub priority: Option<String>,
    pub due: Option<String>,
    pub duration: Option<i32>,
    pub notes: Option<String>,
    pub organization_id: Option<String>,
    pub project_id: Option<String>,
    pub parent_id: Option<String>,
    pub prd: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub synced_at: Option<String>,
    pub is_dirty: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncStatus {
    pub is_online: bool,
    pub pending_changes: i32,
    pub last_sync: Option<String>,
}

// Tauri commands
#[tauri::command]
async fn check_online() -> bool {
    // Try to reach the API
    match reqwest::get("https://sashi-ui.vercel.app/api/status").await {
        Ok(response) => {
            let online = response.status().is_success();
            IS_ONLINE.store(online, Ordering::SeqCst);
            online
        }
        Err(_) => {
            IS_ONLINE.store(false, Ordering::SeqCst);
            false
        }
    }
}

#[tauri::command]
fn get_online_status() -> bool {
    IS_ONLINE.load(Ordering::SeqCst)
}

#[tauri::command]
async fn get_sync_status(app: AppHandle) -> Result<SyncStatus, String> {
    let online = check_online().await;
    
    // Count pending changes from local SQLite
    let pending = match app.try_state::<tauri_plugin_sql::DbInstances>() {
        Some(_) => {
            // Would query: SELECT COUNT(*) FROM tasks WHERE is_dirty = 1
            0 // Placeholder
        }
        None => 0,
    };

    Ok(SyncStatus {
        is_online: online,
        pending_changes: pending,
        last_sync: None,
    })
}

#[tauri::command]
fn emit_online_status(app: AppHandle, online: bool) {
    IS_ONLINE.store(online, Ordering::SeqCst);
    let _ = app.emit("online-status-changed", online);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations(
                    "sqlite:sashi.db",
                    vec![
                        tauri_plugin_sql::Migration {
                            version: 1,
                            description: "create_tasks_table",
                            sql: r#"
                                CREATE TABLE IF NOT EXISTS tasks (
                                    id TEXT PRIMARY KEY,
                                    name TEXT NOT NULL,
                                    status TEXT NOT NULL DEFAULT 'todo',
                                    priority TEXT,
                                    due TEXT,
                                    duration INTEGER,
                                    notes TEXT,
                                    organization_id TEXT,
                                    project_id TEXT,
                                    parent_id TEXT,
                                    prd TEXT,
                                    prd_context TEXT,
                                    prd_chat TEXT,
                                    created_at TEXT NOT NULL,
                                    updated_at TEXT NOT NULL,
                                    synced_at TEXT,
                                    is_dirty INTEGER DEFAULT 0
                                );
                                CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
                                CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due);
                                CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
                                CREATE INDEX IF NOT EXISTS idx_tasks_dirty ON tasks(is_dirty);
                            "#,
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 2,
                            description: "create_organizations_table",
                            sql: r#"
                                CREATE TABLE IF NOT EXISTS organizations (
                                    id TEXT PRIMARY KEY,
                                    name TEXT NOT NULL,
                                    icon TEXT,
                                    created_at TEXT NOT NULL,
                                    updated_at TEXT NOT NULL,
                                    synced_at TEXT,
                                    is_dirty INTEGER DEFAULT 0
                                );
                            "#,
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 3,
                            description: "create_projects_table",
                            sql: r#"
                                CREATE TABLE IF NOT EXISTS projects (
                                    id TEXT PRIMARY KEY,
                                    name TEXT NOT NULL,
                                    organization_id TEXT,
                                    icon TEXT,
                                    created_at TEXT NOT NULL,
                                    updated_at TEXT NOT NULL,
                                    synced_at TEXT,
                                    is_dirty INTEGER DEFAULT 0,
                                    FOREIGN KEY (organization_id) REFERENCES organizations(id)
                                );
                            "#,
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 4,
                            description: "create_tags_table",
                            sql: r#"
                                CREATE TABLE IF NOT EXISTS tags (
                                    id TEXT PRIMARY KEY,
                                    name TEXT NOT NULL UNIQUE,
                                    color TEXT,
                                    created_at TEXT NOT NULL
                                );
                                CREATE TABLE IF NOT EXISTS task_tags (
                                    task_id TEXT NOT NULL,
                                    tag_id TEXT NOT NULL,
                                    PRIMARY KEY (task_id, tag_id),
                                    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                                    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
                                );
                            "#,
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 5,
                            description: "create_sync_log",
                            sql: r#"
                                CREATE TABLE IF NOT EXISTS sync_log (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    entity_type TEXT NOT NULL,
                                    entity_id TEXT NOT NULL,
                                    action TEXT NOT NULL,
                                    synced_at TEXT,
                                    error TEXT
                                );
                            "#,
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
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
        .invoke_handler(tauri::generate_handler![
            check_online,
            get_online_status,
            get_sync_status,
            emit_online_status,
        ])
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
                    &MenuItem::with_id(app, "separator_sync", "", false, None::<&str>)?,
                    &MenuItem::with_id(app, "sync_now", "Sync Now", true, Some("CmdOrCtrl+Shift+R"))?,
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
                    "sync_now" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("sync-now", ());
                        }
                    }
                    "reload" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.eval("location.reload()");
                        }
                    }
                    "toggle_devtools" => {
                        #[cfg(debug_assertions)]
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
                    &MenuItem::with_id(app, "tray_sync", "Sync Now", true, None::<&str>)?,
                    &MenuItem::with_id(app, "tray_separator2", "", false, None::<&str>)?,
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
                        "tray_sync" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("sync-now", ());
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
