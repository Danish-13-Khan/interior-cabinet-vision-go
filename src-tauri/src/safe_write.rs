use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};

pub fn temp_path_for(path: &Path) -> PathBuf {
    let name = path.file_name().and_then(|value| value.to_str()).unwrap_or("project.cabinet");
    path.with_file_name(format!("{name}.tmp"))
}

/// Write `path.tmp`, flush it, then rename over `path`. A crash before rename keeps the original.
/// A failed write deletes the temp file so the next save does not trip over it.
pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
    }
    let temp = temp_path_for(path);
    let result = (|| -> Result<(), String> {
        let mut file = File::create(&temp).map_err(|error| error.to_string())?;
        file.write_all(bytes).map_err(|error| error.to_string())?;
        file.sync_all().map_err(|error| error.to_string())?;
        fs::rename(&temp, path).map_err(|error| error.to_string())
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temp);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn scratch() -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "cabinet-safe-{}",
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn interrupted_write_leaves_the_original() {
        let dir = scratch();
        let path = dir.join("room.cabinet");
        fs::write(&path, b"original").unwrap();
        let temp = temp_path_for(&path);
        fs::write(&temp, b"partial").unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"original");
        fs::remove_file(&temp).unwrap();
        atomic_write(&path, b"saved").unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"saved");
        assert!(!temp_path_for(&path).exists());
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn failed_replace_deletes_the_temp_file() {
        let dir = scratch();
        let path = dir.join("room.cabinet");
        fs::create_dir(&path).unwrap();
        let error = atomic_write(&path, b"bytes");
        assert!(error.is_err());
        assert!(!temp_path_for(&path).exists());
        fs::remove_dir_all(dir).unwrap();
    }
}
