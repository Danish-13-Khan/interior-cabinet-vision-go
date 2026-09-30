use crate::backups::{backup_dir, rotate_backups};
use crate::safe_write::atomic_write;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tauri::ipc::{InvokeBody, Request, Response};
use tauri::Manager;

pub fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            if let Ok(value) = u8::from_str_radix(
                std::str::from_utf8(&bytes[index + 1..index + 3]).unwrap_or(""),
                16,
            ) {
                out.push(value);
                index += 3;
                continue;
            }
        }
        out.push(bytes[index]);
        index += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

pub fn path_from_headers(path_header: Option<&str>) -> Result<String, String> {
    let encoded = path_header.ok_or("Missing project path header.")?;
    let path = percent_decode(encoded);
    if path.is_empty() {
        return Err("Missing project path.".into());
    }
    Ok(path)
}

/// Saves run as async commands, so two can arrive at once (a double Cmd+S). One at a time keeps
/// the read-previous / write / rotate-backups sequence from interleaving.
static SAVE_LOCK: Mutex<()> = Mutex::new(());

/// Replace `path` with `bytes`. When a backup dir is set, slot 1 becomes the previous file, not this write.
/// The project file is what matters: a failed backup is logged, not reported as a failed save.
pub fn save_replacing(path: &str, bytes: &[u8], backup_dir: Option<&Path>) -> Result<(), String> {
    let _guard = SAVE_LOCK.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    let checked = crate::user_path::validate_user_path(path)?;
    let previous = if checked.is_file() {
        Some(fs::read(&checked).map_err(|error| error.to_string())?)
    } else {
        None
    };
    atomic_write(&checked, bytes)?;
    if let (Some(dir), Some(previous)) = (backup_dir, previous) {
        if let Err(error) = rotate_backups(dir, &previous) {
            eprintln!("Saved {path}, but the backup could not be written: {error}");
        }
    }
    Ok(())
}

pub fn write_project_bytes(path: &str, bytes: &[u8]) -> Result<(), String> {
    save_replacing(path, bytes, None)
}

pub fn read_project_bytes(path: &str) -> Result<Vec<u8>, String> {
    let checked = crate::user_path::validate_user_path(path)?;
    fs::read(checked).map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn save_project_bytes(app: tauri::AppHandle, request: Request<'_>) -> Result<(), String> {
    // Async commands run off the UI thread. The body is borrowed, so the bytes are not cloned.
    let header = request.headers().get("path").and_then(|value| value.to_str().ok());
    let path = path_from_headers(header)?;
    let project_id = request
        .headers()
        .get("project-id")
        .and_then(|value| value.to_str().ok())
        .map(percent_decode);
    let bytes = match request.body() {
        InvokeBody::Raw(bytes) => bytes.as_slice(),
        InvokeBody::Json(_) => return Err("Project save expected raw bytes.".into()),
    };
    let backup = project_id.and_then(|project_id| {
        app.path().app_data_dir().ok().map(|dir| backup_dir(&dir, &project_id))
    });
    save_replacing(&path, bytes, backup.as_deref())
}

#[tauri::command]
pub async fn load_project_bytes(path: String) -> Result<Response, String> {
    Ok(Response::new(read_project_bytes(&path)?))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn binary_project_round_trips_without_base64() {
        let path = std::env::temp_dir()
            .join(format!(
                "cabinet-bytes-{}.cabinet",
                SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()
            ))
            .to_string_lossy()
            .into_owned();
        let bytes = b"PK\x03\x04cabinet-bytes";
        write_project_bytes(&path, bytes).expect("write bytes");
        let loaded = read_project_bytes(&path).expect("read bytes");
        assert_eq!(loaded, bytes);
        fs::remove_file(path).expect("remove");
    }

    #[test]
    fn path_header_is_percent_decoded() {
        let decoded = path_from_headers(Some("%2FUsers%2Froom%20plan.cabinet")).unwrap();
        assert_eq!(decoded, "/Users/room plan.cabinet");
    }

    #[test]
    fn backups_are_earlier_versions_not_the_file_just_saved() {
        let dir = std::env::temp_dir().join(format!(
            "cabinet-backup-save-{}",
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("room.cabinet");
        let backups = dir.join("backups");
        let path_text = path.to_string_lossy().into_owned();
        write_project_bytes(&path_text, b"v1").unwrap();
        save_replacing(&path_text, b"v2", Some(&backups)).unwrap();
        save_replacing(&path_text, b"v3", Some(&backups)).unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"v3");
        assert_eq!(fs::read(backups.join("1.cabinet")).unwrap(), b"v2");
        assert_eq!(fs::read(backups.join("2.cabinet")).unwrap(), b"v1");
        assert!(!backups.join("3.cabinet").exists());
        fs::remove_dir_all(dir).unwrap();
    }
}
