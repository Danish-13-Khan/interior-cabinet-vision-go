use std::sync::Mutex;

static PENDING: Mutex<Option<String>> = Mutex::new(None);

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
}
