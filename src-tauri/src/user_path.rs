use std::path::{Component, Path, PathBuf};

const ALLOWED_EXTENSIONS: &[&str] = &[
    "cabinet", "json", "csv", "txt", "png", "pdf", "jpg", "jpeg", "webp",
];

/// Folders under home that hold other apps' settings, keys or tokens. Never read or written.
const SENSITIVE_HOME_DIRS: &[&str] = &[
    "Library/Application Support",
    "Library/Preferences",
    "Library/LaunchAgents",
    "Library/Keychains",
    "Library/Cookies",
    "Library/Containers",
    "Library/Group Containers",
    "AppData",
];

/// System folders a design app has no reason to touch.
const SENSITIVE_ROOTS: &[&str] = &[
    "/etc", "/private/etc", "/System", "/Library", "/usr", "/bin", "/sbin", "/var/root",
];

fn not_allowed() -> String {
    "That path is not allowed.".into()
}

/// Resolve `.` and `..` without touching the disk, so `/a/b/../c` cannot hide where it points.
pub fn lexical_normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// Canonical form when the file (or its folder) exists, so symlinks and `/tmp` vs `/private/tmp` agree.
pub fn normalize(path: &Path) -> PathBuf {
    let lexical = lexical_normalize(path);
    if let Ok(real) = lexical.canonicalize() {
        return real;
    }
    match (lexical.parent(), lexical.file_name()) {
        (Some(parent), Some(name)) => parent
            .canonicalize()
            .map(|real| real.join(name))
            .unwrap_or(lexical),
        _ => lexical,
    }
}

fn home_dir() -> Option<PathBuf> {
    let key = if cfg!(windows) { "USERPROFILE" } else { "HOME" };
    std::env::var_os(key).filter(|value| !value.is_empty()).map(|home| normalize(Path::new(&home)))
}

/// Hidden folders (`~/.ssh`, `~/.claude`, `~/.config`, `~/.docker`, `~/.aws`, …), other apps'
/// settings under `~/Library` / `AppData`, and system folders are always refused.
pub fn is_sensitive(path: &Path) -> bool {
    let hidden_dir = path
        .parent()
        .map(|parent| {
            parent.components().any(|component| match component {
                Component::Normal(name) => name.to_string_lossy().starts_with('.'),
                _ => false,
            })
        })
        .unwrap_or(false);
    if hidden_dir {
        return true;
    }
    if !cfg!(windows) && SENSITIVE_ROOTS.iter().any(|root| path.starts_with(root)) {
        return true;
    }
    if cfg!(windows) {
        let text = path.to_string_lossy().to_ascii_lowercase();
        if text.contains(":\\windows\\") || text.contains(":\\program files") {
            return true;
        }
    }
    home_dir()
        .map(|home| SENSITIVE_HOME_DIRS.iter().any(|dir| path.starts_with(home.join(dir))))
        .unwrap_or(false)
}

/// Shape check every custom file command runs: absolute, one of this app's file types, not in a
/// sensitive folder. Whether the user actually chose the path is `trusted_paths`' job.
pub fn validate_user_path(path: &str) -> Result<PathBuf, String> {
    if path.is_empty() || path.contains('\0') {
        return Err(not_allowed());
    }
    let raw = Path::new(path);
    if !raw.is_absolute() {
        return Err(not_allowed());
    }
    let name = raw.file_name().and_then(|value| value.to_str()).ok_or_else(not_allowed)?;
    let extension = name
        .rsplit_once('.')
        .map(|(_, extension)| extension.to_ascii_lowercase())
        .unwrap_or_default();
    if !ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
        return Err("That file type is not allowed.".into());
    }
    let normalized = normalize(raw);
    if is_sensitive(&lexical_normalize(raw)) || is_sensitive(&normalized) {
        return Err(not_allowed());
    }
    Ok(normalized)
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

    #[cfg(unix)]
    #[test]
    fn refuses_other_apps_settings_and_hidden_folders() {
        let home = std::env::var("HOME").unwrap();
        for bad in [
            format!("{home}/.claude/settings.json"),
            format!("{home}/.docker/config.json"),
            format!("{home}/Library/Application Support/Code/User/settings.json"),
            format!("{home}/Documents/../.aws/credentials.json"),
            "/etc/app.json".to_string(),
        ] {
            assert!(validate_user_path(&bad).is_err(), "{bad} must be refused");
        }
        assert!(validate_user_path(&format!("{home}/Documents/Kitchen/room.cabinet")).is_ok());
    }

    #[test]
    fn dot_dot_is_resolved_before_checks() {
        assert_eq!(lexical_normalize(Path::new("/a/b/../c/./d.json")), PathBuf::from("/a/c/d.json"));
    }
}
