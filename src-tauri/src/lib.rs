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
            call_llm_native
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
