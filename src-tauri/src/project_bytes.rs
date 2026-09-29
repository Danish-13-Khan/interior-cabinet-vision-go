use std::fs;
use std::path::Path;
use tauri::ipc::{InvokeBody, Request, Response};

fn ensure_parent_dir(path: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

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

pub fn write_project_bytes(path: &str, bytes: &[u8]) -> Result<(), String> {
    ensure_parent_dir(path)?;
    fs::write(path, bytes).map_err(|error| error.to_string())
}

pub fn read_project_bytes(path: &str) -> Result<Vec<u8>, String> {
    fs::read(path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_project_bytes(request: Request<'_>) -> Result<(), String> {
    let header = request
        .headers()
        .get("path")
        .and_then(|value| value.to_str().ok());
    let path = path_from_headers(header)?;
    let bytes = match request.body() {
        InvokeBody::Raw(bytes) => bytes.clone(),
        InvokeBody::Json(_) => return Err("Project save expected raw bytes.".into()),
    };
    write_project_bytes(&path, &bytes)
}

#[tauri::command]
pub fn load_project_bytes(path: String) -> Result<Response, String> {
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
}
