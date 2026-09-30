use base64::Engine;
use tauri::Emitter;

mod backups;
mod user_path;
mod open_path;
mod project_bytes;
mod safe_write;
use std::fs;

fn save_project_text(path: &str, contents: &str) -> Result<(), String> {
    safe_write::atomic_write(&user_path::validate_user_path(path)?, contents.as_bytes())
}

fn load_project_text(path: &str) -> Result<String, String> {
    fs::read_to_string(user_path::validate_user_path(path)?).map_err(|error| error.to_string())
}

fn save_binary_bytes(path: &str, bytes: &[u8]) -> Result<(), String> {
    safe_write::atomic_write(&user_path::validate_user_path(path)?, bytes)
}

#[tauri::command]
async fn save_project_file(path: String, contents: String) -> Result<(), String> {
    save_project_text(&path, &contents)
}

#[tauri::command]
async fn load_project_file(path: String) -> Result<String, String> {
    load_project_text(&path)
}

#[tauri::command]
async fn save_binary_file(path: String, base64_data: String) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|e| e.to_string())?;
    save_binary_bytes(&path, &bytes)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(path) = open_path::cabinet_path_from_args(&args) {
                open_path::remember_cabinet_path(path.clone());
                let _ = app.emit("cabinet-open-path", path);
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
        .setup(|app| {
            if let Some(path) = open_path::cabinet_path_from_os_args(std::env::args_os().skip(1)) {
                open_path::remember_cabinet_path(path);
            }
            let _ = app;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Opened { urls } = event {
                for url in urls {
                    let Ok(path) = url.to_file_path() else { continue; };
                    let text = path.to_string_lossy().to_string();
                    if text.to_ascii_lowercase().ends_with(".cabinet") {
                        open_path::remember_cabinet_path(text.clone());
                        let _ = app.emit("cabinet-open-path", text);
                    }
                }
            }
        });
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_path(extension: &str) -> String {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock")
            .as_nanos();
        std::env::temp_dir()
            .join(format!("interior-cabinet-designer-{nonce}.{extension}"))
            .to_string_lossy()
            .into_owned()
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
        let loaded = fs::read(path.clone()).expect("read binary");

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

        save_project_text(&text_path.to_string_lossy(), "{\"ok\":true}")
            .expect("save text in nested folder");
        save_binary_bytes(&binary_path.to_string_lossy(), b"png")
            .expect("save binary in nested folder");

        assert_eq!(fs::read_to_string(text_path).expect("read nested text"), "{\"ok\":true}");
        assert_eq!(fs::read(binary_path).expect("read nested binary"), b"png");
        fs::remove_dir_all(base).expect("remove nested export folder");
    }

    #[test]
    fn invalid_binary_data_returns_an_actionable_error() {
        let path = test_path("png");
        let error = tauri::async_runtime::block_on(save_binary_file(path, "not-base64***".to_string()))
            .expect_err("invalid base64 must fail");

        assert!(!error.trim().is_empty());
    }
}
