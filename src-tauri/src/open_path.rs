use std::sync::Mutex;

static PENDING: Mutex<Option<String>> = Mutex::new(None);

pub fn cabinet_path_from_os_args<I, S>(args: I) -> Option<String>
where
    I: IntoIterator<Item = S>,
    S: AsRef<std::ffi::OsStr>,
{
    let owned: Vec<String> = args
        .into_iter()
        .map(|arg| arg.as_ref().to_string_lossy().into_owned())
        .collect();
    cabinet_path_from_args(&owned)
}

pub fn cabinet_path_from_args(args: &[String]) -> Option<String> {
    args.iter().find_map(|arg| {
        let trimmed = arg.trim().trim_matches('"');
        if trimmed.starts_with('-') {
            return None;
        }
        if trimmed.to_ascii_lowercase().ends_with(".cabinet") {
            Some(trimmed.to_string())
        } else {
            None
        }
    })
}

pub fn remember_cabinet_path(path: String) {
    if let Ok(mut slot) = PENDING.lock() {
        *slot = Some(path);
    }
}

#[tauri::command]
pub fn take_pending_cabinet_path() -> Option<String> {
    PENDING.lock().ok().and_then(|mut slot| slot.take())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_a_cabinet_path_and_ignores_flags() {
        let args = vec![
            "--debug".to_string(),
            "/tmp/other.json".to_string(),
            "/Users/room/plan.cabinet".to_string(),
        ];
        assert_eq!(
            cabinet_path_from_args(&args).as_deref(),
            Some("/Users/room/plan.cabinet")
        );
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
        let found = cabinet_path_from_os_args([arg]);
        assert!(found.is_some());
    }
}
