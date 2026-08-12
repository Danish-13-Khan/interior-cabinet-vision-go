use base64::Engine;
use std::fs;
use std::path::Path;

fn ensure_parent_dir(path: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn save_project_file(path: String, contents: String) -> Result<(), String> {
    ensure_parent_dir(&path)?;
    fs::write(path, contents).map_err(|error| error.to_string())
}

#[tauri::command]
fn load_project_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|error| error.to_string())
}

#[tauri::command]
fn save_binary_file(path: String, base64_data: String) -> Result<(), String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(base64_data.as_bytes())
        .map_err(|e| e.to_string())?;
    ensure_parent_dir(&path)?;
    fs::write(path, bytes).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_project_file,
            load_project_file,
            save_binary_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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

        save_project_file(path.clone(), contents.to_string()).expect("save project");
        let loaded = load_project_file(path.clone()).expect("load project");

        assert_eq!(loaded, contents);
        fs::remove_file(path).expect("remove test project");
    }

    #[test]
    fn binary_export_decodes_base64_before_writing() {
        let path = test_path("png");
        let encoded = base64::engine::general_purpose::STANDARD.encode(b"release-image");

        save_binary_file(path.clone(), encoded).expect("save binary");
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

        save_project_file(
            text_path.to_string_lossy().into_owned(),
            "{\"ok\":true}".to_string(),
        )
        .expect("save text in nested folder");
        save_binary_file(
            binary_path.to_string_lossy().into_owned(),
            base64::engine::general_purpose::STANDARD.encode(b"png"),
        )
        .expect("save binary in nested folder");

        assert_eq!(fs::read_to_string(text_path).expect("read nested text"), "{\"ok\":true}");
        assert_eq!(fs::read(binary_path).expect("read nested binary"), b"png");
        fs::remove_dir_all(base).expect("remove nested export folder");
    }

    #[test]
    fn invalid_binary_data_returns_an_actionable_error() {
        let path = test_path("png");
        let error = save_binary_file(path, "not-base64***".to_string())
            .expect_err("invalid base64 must fail");

        assert!(!error.trim().is_empty());
    }
}
