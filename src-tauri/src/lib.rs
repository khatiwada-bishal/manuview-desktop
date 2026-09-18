use keyring::Entry;

const SERVICE_NAME: &str = "com.manuview.desktop";

fn get_keyring_entry(provider: &str) -> Result<Entry, String> {
    let sanitized_provider = provider.trim().to_lowercase();
    if sanitized_provider.is_empty() {
        return Err("Provider name cannot be empty".into());
    }
    if !sanitized_provider
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
    {
        return Err("Invalid provider name".into());
    }
    let username = format!("api_key_{}", sanitized_provider);
    Entry::new(SERVICE_NAME, &username).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_api_credential(provider: String, key: String) -> Result<(), String> {
    let entry = get_keyring_entry(&provider)?;
    let trimmed = key.trim();
    if trimmed.is_empty() {
        let _ = entry.delete_credential();
        return Ok(());
    }
    entry.set_password(trimmed).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_api_credential(provider: String) -> Result<String, String> {
    let entry = get_keyring_entry(&provider)?;
    match entry.get_password() {
        Ok(password) => Ok(password),
        Err(keyring::Error::NoEntry) => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn delete_api_credential(provider: String) -> Result<(), String> {
    let entry = get_keyring_entry(&provider)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn has_api_credential(provider: String) -> Result<bool, String> {
    let entry = get_keyring_entry(&provider)?;
    match entry.get_password() {
        Ok(password) => Ok(!password.trim().is_empty()),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(_) => Ok(false),
    }
}

#[derive(serde::Serialize)]
struct HttpResponsePayload {
    status: u16,
    body: String,
    ok: bool,
}

#[tauri::command]
async fn call_llm_native(
    url: String,
    method: String,
    headers: std::collections::HashMap<String, String>,
    body: Option<String>,
) -> Result<HttpResponsePayload, String> {
    // SSRF Hardening (P3 §5.4): Restrict destination host to verified LLM & academic providers
    let parsed_url = reqwest::Url::parse(&url).map_err(|e| format!("Invalid destination URL: {}", e))?;
    let host = parsed_url.host_str().ok_or("Destination URL missing host")?.to_lowercase();
    let is_allowed = host == "api.openai.com"
        || host == "api.anthropic.com"
        || host == "generativelanguage.googleapis.com"
        || host == "api.groq.com"
        || host == "api.mistral.ai"
        || host == "openrouter.ai"
        || host == "integrate.api.nvidia.com"
        || host == "api.openalex.org"
        || host == "api.crossref.org"
        || host == "huggingface.co"
        || host.ends_with(".huggingface.co")
        || host == "raw.githubusercontent.com"
        || host.ends_with(".githubusercontent.com")
        || host == "localhost"
        || host == "127.0.0.1";

    if !is_allowed {
        return Err(format!("SSRF Violation: Target host '{}' is not in the allowed API destinations list.", host));
    }

    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let http_method = match method.to_uppercase().as_str() {
        "POST" => reqwest::Method::POST,
        "GET" => reqwest::Method::GET,
        "PUT" => reqwest::Method::PUT,
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };

    let mut req = client.request(http_method, &url);
    for (k, v) in headers {
        req = req.header(k, v);
    }

    if let Some(b) = body {
        req = req.body(b);
    }

    let resp = req
        .send()
        .await
        .map_err(|e| format!("Native network request failed: {}", e))?;
    let status = resp.status().as_u16();
    let ok = resp.status().is_success();
    let text = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    Ok(HttpResponsePayload {
        status,
        body: text,
        ok,
    })
}

#[tauri::command]
fn show_in_folder(path: String) -> Result<(), String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return Err("Path cannot be empty".into());
    }

    let p = std::path::Path::new(trimmed);

    #[cfg(target_os = "macos")]
    {
        // On macOS: 'open -R <file>' reveals and selects the file in Finder.
        // If directory or file doesn't exist, open directory.
        if p.exists() && !p.is_dir() {
            std::process::Command::new("open")
                .arg("-R")
                .arg(trimmed)
                .spawn()
                .map_err(|e| format!("Failed to reveal in Finder: {}", e))?;
        } else if p.is_dir() {
            std::process::Command::new("open")
                .arg(trimmed)
                .spawn()
                .map_err(|e| format!("Failed to open directory: {}", e))?;
        } else if let Some(parent) = p.parent() {
            std::process::Command::new("open")
                .arg(parent)
                .spawn()
                .map_err(|e| format!("Failed to open parent directory: {}", e))?;
        } else {
            std::process::Command::new("open")
                .arg(trimmed)
                .spawn()
                .map_err(|e| format!("Failed to open path: {}", e))?;
        }
        Ok(())
    }

    #[cfg(target_os = "windows")]
    {
        if p.exists() && !p.is_dir() {
            std::process::Command::new("explorer")
                .arg(format!("/select,{}", trimmed))
                .spawn()
                .map_err(|e| format!("Failed to reveal in Explorer: {}", e))?;
        } else {
            let target = if p.is_dir() {
                trimmed
            } else if let Some(parent) = p.parent().and_then(|p| p.to_str()) {
                parent
            } else {
                trimmed
            };
            std::process::Command::new("explorer")
                .arg(target)
                .spawn()
                .map_err(|e| format!("Failed to open folder: {}", e))?;
        }
        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        let target = if p.is_dir() {
            p
        } else {
            p.parent().unwrap_or(p)
        };
        std::process::Command::new("xdg-open")
            .arg(target)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            save_api_credential,
            get_api_credential,
            delete_api_credential,
            has_api_credential,
            call_llm_native,
            show_in_folder
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
