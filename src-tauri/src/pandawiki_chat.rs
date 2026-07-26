//! Secure PandaWiki OpenAI-compatible chat boundary.
//!
//! The WebView never receives a chat API token: this module reads the token
//! from the platform credential store and performs the HTTPS request itself.

use keyring::Entry;
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};

const CREDENTIAL_SERVICE: &str = "llm-wiki-pandawiki-chat";

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteChatInput {
    pub endpoint_url: String,
    pub model: String,
    pub timeout_seconds: u64,
    pub messages: Vec<ChatMessage>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteChatOutput {
    pub content: String,
    pub model: String,
}

#[derive(Debug, Serialize)]
struct OpenAiRequest<'a> {
    model: &'a str,
    messages: &'a [ChatMessage],
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OpenAiResponse {
    model: Option<String>,
    choices: Vec<OpenAiChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAiMessage {
    content: String,
}

fn endpoint_account(endpoint_url: &str) -> Result<String, String> {
    let url = reqwest::Url::parse(endpoint_url).map_err(|_| "not_configured: invalid endpoint URL".to_string())?;
    if !matches!(url.scheme(), "https" | "http") || !url.path().ends_with("/chat/completions") {
        return Err("not_configured: endpoint must be a complete chat completions URL".to_string());
    }
    let host = url.host_str().ok_or_else(|| "not_configured: endpoint host is required".to_string())?;
    Ok(match url.port() {
        Some(port) => format!("{host}:{port}"),
        None => host.to_string(),
    })
}

fn credential_entry(endpoint_url: &str) -> Result<Entry, String> {
    let account = endpoint_account(endpoint_url)?;
    Entry::new(CREDENTIAL_SERVICE, &account)
        .map_err(|_| "credential_unavailable: Windows Credential Manager is unavailable".to_string())
}

fn load_token(endpoint_url: &str) -> Result<String, String> {
    credential_entry(endpoint_url)?
        .get_password()
        .map_err(|_| "not_configured: no PandaWiki chat token is stored for this server".to_string())
}

fn request_body(input: &CompleteChatInput) -> Result<OpenAiRequest<'_>, String> {
    if input.model.trim().is_empty() || input.messages.is_empty() {
        return Err("not_configured: model and messages are required".to_string());
    }
    if input.messages.iter().any(|message| {
        !matches!(message.role.as_str(), "system" | "user" | "assistant") || message.content.trim().is_empty()
    }) {
        return Err("invalid_response: messages must contain a role and non-empty content".to_string());
    }
    // V1 is deliberately non-streaming. The field is never accepted from the
    // WebView, so a caller cannot accidentally open an SSE response here.
    Ok(OpenAiRequest { model: &input.model, messages: &input.messages, stream: false })
}

fn parse_response(body: OpenAiResponse, fallback_model: &str) -> Result<CompleteChatOutput, String> {
    let choice = body.choices.into_iter().next().ok_or_else(|| "invalid_response: response has no choices".to_string())?;
    let content = choice.message.content.trim().to_string();
    if content.is_empty() {
        return Err("invalid_response: response content is empty".to_string());
    }
    Ok(CompleteChatOutput {
        content,
        model: body.model.unwrap_or_else(|| fallback_model.to_string()),
    })
}

#[tauri::command]
pub fn save_pandawiki_chat_token(endpoint_url: String, token: String) -> Result<(), String> {
    if token.trim().is_empty() {
        return Err("not_configured: chat token is required".to_string());
    }
    credential_entry(&endpoint_url)?
        .set_password(token.trim())
        .map_err(|_| "credential_unavailable: could not save the chat token".to_string())
}

#[tauri::command]
pub fn clear_pandawiki_chat_token(endpoint_url: String) -> Result<(), String> {
    let entry = credential_entry(&endpoint_url)?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        // Deleting an absent entry is equivalent to clearing it and avoids
        // exposing platform-specific credential-store details to the UI.
        Err(error) if error.to_string().contains("NoEntry") || error.to_string().contains("not found") => Ok(()),
        Err(_) => Err("credential_unavailable: could not clear the chat token".to_string()),
    }
}

#[tauri::command]
pub fn has_pandawiki_chat_token(endpoint_url: String) -> Result<bool, String> {
    match credential_entry(&endpoint_url)?.get_password() {
        Ok(token) => Ok(!token.trim().is_empty()),
        Err(error) if error.to_string().contains("NoEntry") || error.to_string().contains("not found") => Ok(false),
        Err(_) => Err("credential_unavailable: Windows Credential Manager is unavailable".to_string()),
    }
}

#[tauri::command]
pub async fn complete_pandawiki_chat(input: CompleteChatInput) -> Result<CompleteChatOutput, String> {
    let token = load_token(&input.endpoint_url)?;
    let payload = request_body(&input)?;
    let timeout = std::time::Duration::from_secs(input.timeout_seconds.clamp(5, 120));
    let client = reqwest::Client::builder()
        .timeout(timeout)
        // Keep normal TLS verification enabled. Do not add dangerous TLS
        // exceptions here; deployment must fix CA trust and SAN matching.
        .build()
        .map_err(|_| "unreachable: could not create HTTPS client".to_string())?;
    let response = client
        .post(&input.endpoint_url)
        .bearer_auth(token)
        .json(&payload)
        .send()
        .await
        .map_err(|error| {
            if error.is_timeout() { "timeout: PandaWiki chat timed out".to_string() }
            else { "unreachable: PandaWiki chat server could not be reached".to_string() }
        })?;
    if response.status() == StatusCode::UNAUTHORIZED {
        return Err("unauthorized: PandaWiki chat token was rejected".to_string());
    }
    if !response.status().is_success() {
        return Err("unreachable: PandaWiki chat server returned an error".to_string());
    }
    let body = response
        .json::<OpenAiResponse>()
        .await
        .map_err(|_| "invalid_response: response is not a valid OpenAI chat completion".to_string())?;
    parse_response(body, &input.model)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn input() -> CompleteChatInput {
        CompleteChatInput {
            endpoint_url: "https://wiki.example/share/v1/chat/completions".to_string(),
            model: "knowledge-base".to_string(),
            timeout_seconds: 90,
            messages: vec![ChatMessage { role: "user".to_string(), content: "hello".to_string() }],
        }
    }

    #[test]
    fn request_is_openai_compatible_and_never_sends_kb_header_or_streaming() {
        let input = input();
        let payload = request_body(&input).unwrap();
        let json = serde_json::to_value(payload).unwrap();
        assert_eq!(json["messages"], json!([{ "role": "user", "content": "hello" }]));
        assert_eq!(json["stream"], false);
        assert!(json.get("X-KB-ID").is_none());
    }

    #[test]
    fn endpoint_is_used_as_a_complete_url_not_a_base_url() {
        assert_eq!(endpoint_account("https://wiki.example:2444/share/v1/chat/completions").unwrap(), "wiki.example:2444");
        assert!(endpoint_account("https://wiki.example/share/v1").is_err());
    }

    #[test]
    fn invalid_choices_or_content_is_rejected() {
        let no_choices = OpenAiResponse { model: None, choices: vec![] };
        assert!(parse_response(no_choices, "knowledge-base").unwrap_err().starts_with("invalid_response"));
        let blank = OpenAiResponse {
            model: None,
            choices: vec![OpenAiChoice { message: OpenAiMessage { content: " ".to_string() } }],
        };
        assert!(parse_response(blank, "knowledge-base").unwrap_err().starts_with("invalid_response"));
    }
}
