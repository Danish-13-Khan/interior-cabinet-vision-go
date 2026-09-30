use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::Emitter;

/// A path waiting for the frontend. Only set while no page is listening, so a path that was
/// already delivered cannot reopen after a reload and beat session restore.
static PENDING: Mutex<Option<String>> = Mutex::new(None);
/// True once the current page has listened and taken the pending path; reset on every page load.
static LISTENING: AtomicBool = AtomicBool::new(false);

fn is_project_file(path: &Path) -> bool {
    let name = path.to_string_lossy().to_ascii_lowercase();
    name.ends_with(".cabinet") || name.ends_with(".json")
}

/// Resolve `arg` against `cwd` when relative, canonicalize, and keep it only when it is an
/// existing `.cabinet` / `.json` file.
pub fn resolve_project_arg(arg: &str, cwd: Option<&Path>) -> Option<PathBuf> {
    let trimmed = arg.trim().trim_matches('"');
    if trimmed.is_empty() || trimmed.starts_with('-') {
        return None;
    }
    let raw = Path::new(trimmed);
    let joined = if raw.is_absolute() { raw.to_path_buf() } else { cwd?.join(raw) };
    let real = joined.canonicalize().ok()?;
    (real.is_file() && is_project_file(&real)).then_some(real)
}

pub fn cabinet_path_from_os_args<I, S>(args: I, cwd: Option<&Path>) -> Option<PathBuf>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
    let owned: Vec<String> = args
        .into_iter()
        .map(|arg| arg.as_ref().to_string_lossy().into_owned())
        .collect();
    cabinet_path_from_args(&owned, cwd)
}

pub fn cabinet_path_from_args(args: &[String], cwd: Option<&Path>) -> Option<PathBuf> {
    args.iter().find_map(|arg| resolve_project_arg(arg, cwd))
}

pub fn remember_cabinet_path(path: String) {
    if let Ok(mut slot) = PENDING.lock() {
        *slot = Some(path);
    }
}

/// A new page is loading: its listener is not up yet, so later paths must wait in PENDING.
pub fn page_loading() {
    LISTENING.store(false, Ordering::SeqCst);
}

/// Trust a path the OS handed over and send it to the page, keeping it pending only when no
/// page is listening yet.
pub fn deliver<R: tauri::Runtime>(app: &tauri::AppHandle<R>, path: &Path) {
    crate::trusted_paths::trust_os_path(app, path);
    let text = path.to_string_lossy().into_owned();
    if !LISTENING.load(Ordering::SeqCst) {
        remember_cabinet_path(text.clone());
    }
    let _ = app.emit("cabinet-open-path", text);
}

/// Called by the page after it starts listening: hands over the launch path and marks it ready.
#[tauri::command]
pub fn take_pending_cabinet_path() -> Option<String> {
    LISTENING.store(true, Ordering::SeqCst);
    PENDING.lock().ok().and_then(|mut slot| slot.take())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn scratch_file(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "cabinet-open-{}",
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos()
        ));
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join(name);
        std::fs::write(&file, b"x").unwrap();
        file
    }

    #[test]
    fn finds_an_existing_project_and_ignores_flags_and_missing_files() {
        let file = scratch_file("plan.cabinet");
        let args = vec![
            "--debug".to_string(),
            "/definitely/missing.cabinet".to_string(),
            file.to_string_lossy().into_owned(),
        ];
        assert_eq!(cabinet_path_from_args(&args, None), Some(file.canonicalize().unwrap()));
        std::fs::remove_dir_all(file.parent().unwrap()).unwrap();
    }

    #[test]
    fn relative_paths_resolve_against_the_launch_folder() {
        let file = scratch_file("room.json");
        let cwd = file.parent().unwrap();
        let found = cabinet_path_from_args(&["room.json".to_string()], Some(cwd));
        assert_eq!(found, Some(file.canonicalize().unwrap()));
        assert_eq!(cabinet_path_from_args(&["room.json".to_string()], None), None);
        std::fs::remove_dir_all(cwd).unwrap();
    }

    #[test]
    fn other_file_types_are_ignored() {
        let file = scratch_file("notes.txt");
        assert_eq!(resolve_project_arg(&file.to_string_lossy(), None), None);
        std::fs::remove_dir_all(file.parent().unwrap()).unwrap();
    }

    #[test]
    fn pending_path_is_cleared_so_it_cannot_reopen() {
        remember_cabinet_path("/tmp/once.cabinet".into());
        assert_eq!(take_pending_cabinet_path().as_deref(), Some("/tmp/once.cabinet"));
        assert_eq!(take_pending_cabinet_path(), None);
    }

    #[cfg(unix)]
    #[test]
    fn non_utf8_args_do_not_panic() {
        use std::os::unix::ffi::OsStrExt;
        let arg = std::ffi::OsStr::from_bytes(b"/tmp/room\xff.cabinet");
        assert!(cabinet_path_from_os_args([arg], None).is_none());
    }
}
