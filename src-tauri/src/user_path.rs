use std::path::{Path, PathBuf};

const ALLOWED_EXTENSIONS: &[&str] = &[
    "cabinet", "json", "csv", "txt", "png", "pdf", "jpg", "jpeg", "webp",
];

/// Custom file commands accept only absolute paths of the types this app reads and writes.
pub fn validate_user_path(path: &str) -> Result<PathBuf, String> {
    if path.is_empty() || path.contains('\0') {
        return Err("That path is not allowed.".into());
    }
    let path = Path::new(path);
    if !path.is_absolute() {
        return Err("That path is not allowed.".into());
    }
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "That path is not allowed.".to_string())?;
    let extension = name
        .rsplit_once('.')
        .map(|(_, extension)| extension.to_ascii_lowercase())
        .unwrap_or_default();
    if !ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
        return Err("That file type is not allowed.".into());
    }
    Ok(path.to_path_buf())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_relative_paths_and_unknown_types() {
        assert!(validate_user_path("room.cabinet").is_err());
        assert!(validate_user_path("/tmp/notes.txt\0.cabinet").is_err());
        assert!(validate_user_path("/tmp/secret.ssh").is_err());
        assert!(validate_user_path("/tmp/room.CABINET").is_ok());
    }
}
