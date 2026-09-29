use crate::safe_write::atomic_write;
use std::fs;
use std::path::{Path, PathBuf};

pub fn backup_dir(app_data: &Path, project_id: &str) -> PathBuf {
    let safe: String = project_id
        .chars()
        .map(|char| if char.is_ascii_alphanumeric() || char == '-' || char == '_' { char } else { '_' })
        .collect();
    app_data.join("backups").join(if safe.is_empty() { "project".to_string() } else { safe })
}

/// Keep `<appData>/backups/<projectId>/1..3.cabinet`, newest in slot 1.
pub fn rotate_backups(dir: &Path, bytes: &[u8]) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|error| error.to_string())?;
    let first = dir.join("1.cabinet");
    let second = dir.join("2.cabinet");
    let third = dir.join("3.cabinet");
    if third.exists() {
        fs::remove_file(&third).map_err(|error| error.to_string())?;
    }
    if second.exists() {
        fs::rename(&second, &third).map_err(|error| error.to_string())?;
    }
    if first.exists() {
        fs::rename(&first, &second).map_err(|error| error.to_string())?;
    }
    atomic_write(&first, bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn rotation_keeps_three_newest_first() {
        let dir = std::env::temp_dir().join(format!(
            "cabinet-backups-{}",
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()
        ));
        for (index, label) in [b"a" as &[u8], b"b", b"c", b"d"].iter().enumerate() {
            rotate_backups(&dir, label).unwrap();
            let _ = index;
        }
        assert_eq!(fs::read(dir.join("1.cabinet")).unwrap(), b"d");
        assert_eq!(fs::read(dir.join("2.cabinet")).unwrap(), b"c");
        assert_eq!(fs::read(dir.join("3.cabinet")).unwrap(), b"b");
        assert!(!dir.join("4.cabinet").exists());
        fs::remove_dir_all(dir).unwrap();
    }
}
