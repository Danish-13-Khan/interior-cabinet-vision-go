use base64::Engine;
use tauri::Manager;

mod backups;
mod open_path;
mod project_bytes;
mod safe_write;
mod trusted_paths;
mod user_path;
use std::fs;
use std::path::Path;

fn save_project_text(path: &Path, contents: &str) -> Result<(), String> {
    safe_write::atomic_write(path, contents.as_bytes())
}

fn load_project_text(path: &Path) -> Result<String, String> {
    fs::read_to_string(path).map_err(|error| error.to_string())
}

fn save_binary_bytes(path: &Path, bytes: &[u8]) -> Result<(), String> {
    safe_write::atomic_write(path, bytes)
}

#[tauri::command]
async fn save_project_file(app: tauri::AppHandle, path: String, contents: String) -> Result<(), String> {
    save_project_text(&trusted_paths::authorize(&app, &path)?, &contents)
}

#[tauri::command]
async fn load_project_file(app: tauri::AppHandle, path: String) -> Result<String, String> {
    load_project_text(&trusted_paths::authorize(&app, &path)?)
}

#[tauri::command]
async fn save_binary_file(app: tauri::AppHandle, path: String, base64_data: String) -> Result<(), String> {
    let checked = trusted_paths::authorize(&app, &path)?;
    save_binary_bytes(&checked, &decode_base64(&base64_data)?)
}

fn decode_base64(data: &str) -> Result<Vec<u8>, String> {
    base64::engine::general_purpose::STANDARD
        .decode(data.as_bytes())
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            // args[0] is the second instance's executable; paths are relative to its cwd.
            let cwd = (!cwd.is_empty()).then(|| Path::new(&cwd).to_path_buf());
            let rest = args.get(1..).unwrap_or_default();
            if let Some(path) = open_path::cabinet_path_from_args(rest, cwd.as_deref()) {
                open_path::deliver(app, &path);
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_project_file,
            load_project_file,
            save_binary_file,
            project_bytes::save_project_bytes,
            project_bytes::load_project_bytes,
            open_path::take_pending_cabinet_path
        ])
        .on_page_load(|_, payload| {
            if payload.event() == tauri::webview::PageLoadEvent::Started {
                open_path::page_loading();
            }
        })
        .setup(|app| {
            let app_data = app.path().app_data_dir().ok();
            app.manage(trusted_paths::TrustedPaths::load(app_data));
            let cwd = std::env::current_dir().ok();
            if let Some(path) = open_path::cabinet_path_from_os_args(std::env::args_os().skip(1), cwd.as_deref()) {
                open_path::deliver(app.handle(), &path);
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                for url in urls {
                    let Ok(path) = url.to_file_path() else { continue; };
                    if let Some(path) = open_path::resolve_project_arg(&path.to_string_lossy(), None) {
                        open_path::deliver(app, &path);
                    }
                }
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_path(extension: &str) -> std::path::PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock")
            .as_nanos();
        std::env::temp_dir().join(format!("interior-cabinet-designer-{nonce}.{extension}"))
    }

    #[test]
    fn project_text_round_trips_through_native_commands() {
        let path = test_path("json");
        let contents = r#"{"format":"interior-project","schemaVersion":1}"#;

        save_project_text(&path, contents).expect("save project");
        let loaded = load_project_text(&path).expect("load project");

        assert_eq!(loaded, contents);
        fs::remove_file(path).expect("remove test project");
    }

    #[test]
    fn binary_export_decodes_base64_before_writing() {
        let path = test_path("png");
        save_binary_bytes(&path, b"release-image").expect("save binary");
        let loaded = fs::read(&path).expect("read binary");

        assert_eq!(loaded, b"release-image");
        fs::remove_file(path).expect("remove test image");
    }

    #[test]
    fn save_commands_create_parent_directories() {
        let base = std::env::temp_dir().join(format!(
            "interior-cabinet-designer-dir-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        let text_path = base.join("client-preview").join("project.json");
        let binary_path = base.join("client-preview").join("hero.png");

        save_project_text(&text_path, "{\"ok\":true}")
            .expect("save text in nested folder");
        save_binary_bytes(&binary_path, b"png")
            .expect("save binary in nested folder");

        assert_eq!(fs::read_to_string(text_path).expect("read nested text"), "{\"ok\":true}");
        assert_eq!(fs::read(binary_path).expect("read nested binary"), b"png");
        fs::remove_dir_all(base).expect("remove nested export folder");
    }

    #[test]
    fn invalid_binary_data_returns_an_actionable_error() {
        let error = decode_base64("not-base64***").expect_err("invalid base64 must fail");

        assert!(!error.trim().is_empty());
    }
}
