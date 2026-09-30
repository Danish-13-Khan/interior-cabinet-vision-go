//! Which files the webview may read or write through this app's own file commands.
//!
//! A path is usable only when it passes `user_path::validate_user_path` (absolute, one of this
//! app's file types, not in a hidden / settings / system folder) AND the user chose it:
//! - picked in a native Open/Save dialog or dropped on the window (the dialog and fs plugins
//!   add those to the fs plugin's runtime scope, which only native UI can grow), or
//! - handed to the app by the OS: Finder "Open With", the command line, or a second launch.
//!
//! Chosen paths are remembered in `<appData>/trusted-paths.json` (newest last, at most
//! `MAX_REMEMBERED`) so recent files and session restore work after a restart.
//! A picked `name` also covers `name.cabinet` (the app adds the extension) and, for a picked
//! `package.pdf`, files directly inside the `package/` folder the client-package export creates.
//!
//! Limits: a script running in the webview can still read or overwrite files the user chose
//! earlier, and the package-folder rule means picking `X.pdf` opens the files directly in `X/`.
//! It cannot reach other files on disk; the remembered list itself sits in app data, which
//! `validate_user_path` refuses.
use crate::user_path::{normalize, validate_user_path};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_fs::FsExt;

const MAX_REMEMBERED: usize = 50;
const STORE_NAME: &str = "trusted-paths.json";

pub struct TrustedPaths {
    paths: Mutex<Vec<PathBuf>>,
    store: Option<PathBuf>,
}

impl TrustedPaths {
    #[cfg(test)]
    pub fn in_memory() -> Self {
        Self { paths: Mutex::new(Vec::new()), store: None }
    }

    pub fn load(app_data: Option<PathBuf>) -> Self {
        let store = app_data.map(|dir| dir.join(STORE_NAME));
        let paths = store
            .as_ref()
            .and_then(|file| fs::read_to_string(file).ok())
            .and_then(|text| serde_json::from_str::<Vec<PathBuf>>(&text).ok())
            .unwrap_or_default();
        Self { paths: Mutex::new(paths), store }
    }

    pub fn contains(&self, path: &Path) -> bool {
        let wanted = normalize(path);
        self.paths.lock().map(|paths| paths.iter().any(|known| *known == wanted)).unwrap_or(false)
    }

    /// Remember `path` as chosen by the user. Moves it to the newest slot and persists the list.
    pub fn trust(&self, path: &Path) {
        let wanted = normalize(path);
        let Ok(mut paths) = self.paths.lock() else { return };
        if paths.last() == Some(&wanted) {
            return;
        }
        paths.retain(|known| *known != wanted);
        paths.push(wanted);
        let overflow = paths.len().saturating_sub(MAX_REMEMBERED);
        paths.drain(..overflow);
        if let (Some(store), Ok(text)) = (&self.store, serde_json::to_string(&*paths)) {
            if let Err(error) = crate::safe_write::atomic_write(store, text.as_bytes()) {
                eprintln!("Could not remember trusted file paths: {error}");
            }
        }
    }

    /// `path` itself plus the chosen paths that also cover it (see the module docs).
    fn grants(path: &Path) -> Vec<PathBuf> {
        let mut out = vec![path.to_path_buf()];
        let text = path.to_string_lossy();
        if text.to_ascii_lowercase().ends_with(".cabinet") {
            out.push(PathBuf::from(&text[..text.len() - ".cabinet".len()]));
        }
        if let Some(folder) = path.parent() {
            let mut pdf = folder.as_os_str().to_owned();
            pdf.push(".pdf");
            out.push(PathBuf::from(pdf));
        }
        out
    }

    /// Validate `path` and require that the user chose it (or a path that covers it).
    pub fn check(&self, path: &str, picked: impl Fn(&Path) -> bool) -> Result<PathBuf, String> {
        let checked = validate_user_path(path)?;
        let raw = crate::user_path::lexical_normalize(Path::new(path));
        let mut candidates = Self::grants(&raw);
        candidates.extend(Self::grants(&checked));
        for candidate in &candidates {
            if self.contains(candidate) {
                return Ok(checked);
            }
            if picked(candidate) {
                self.trust(candidate);
                return Ok(checked);
            }
        }
        Err("Choose this file with Open or Save first.".into())
    }
}

/// The checked path for a file command, or an error when the user never chose it.
pub fn authorize<R: tauri::Runtime>(app: &tauri::AppHandle<R>, path: &str) -> Result<PathBuf, String> {
    let scope = app.try_fs_scope();
    let picked = |candidate: &Path| scope.as_ref().map(|scope| scope.is_allowed(candidate)).unwrap_or(false);
    match app.try_state::<TrustedPaths>() {
        Some(trusted) => trusted.check(path, picked),
        None => Err("File access is not ready yet.".into()),
    }
}

/// Paths the OS handed over (Finder, command line, second launch) count as chosen by the user.
pub fn trust_os_path<R: tauri::Runtime>(app: &tauri::AppHandle<R>, path: &Path) {
    if let Some(trusted) = app.try_state::<TrustedPaths>() {
        trusted.trust(path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn home_file(name: &str) -> String {
        format!("{}/Documents/{name}", std::env::var("HOME").unwrap_or_else(|_| "/Users/x".into()))
    }

    #[test]
    fn unchosen_json_is_refused_even_with_a_valid_type() {
        let trusted = TrustedPaths::in_memory();
        assert!(trusted.check(&home_file("settings.json"), |_| false).is_err());
    }

    #[test]
    fn dialog_pick_is_remembered_for_later_opens() {
        let trusted = TrustedPaths::in_memory();
        let path = home_file("room.cabinet");
        assert!(trusted.check(&path, |candidate| candidate == Path::new(&path)).is_ok());
        assert!(trusted.check(&path, |_| false).is_ok());
    }

    #[test]
    fn picked_name_covers_added_extension_and_package_folder() {
        let trusted = TrustedPaths::in_memory();
        trusted.trust(Path::new(&home_file("room")));
        assert!(trusted.check(&home_file("room.cabinet"), |_| false).is_ok());
        trusted.trust(Path::new(&home_file("client.pdf")));
        assert!(trusted.check(&home_file("client/manifest.json"), |_| false).is_ok());
        assert!(trusted.check(&home_file("client/nested/x.json"), |_| false).is_err());
    }

    #[test]
    fn remembered_list_is_capped() {
        let trusted = TrustedPaths::in_memory();
        for index in 0..(MAX_REMEMBERED + 5) {
            trusted.trust(Path::new(&home_file(&format!("{index}.cabinet"))));
        }
        assert_eq!(trusted.paths.lock().unwrap().len(), MAX_REMEMBERED);
        assert!(!trusted.contains(Path::new(&home_file("0.cabinet"))));
    }
}
