import { invoke } from "@tauri-apps/api/core"

/**
 * The token never crosses this interface in the read direction. Rust owns both
 * Credential Manager reads and the HTTP request that uses the credential.
 */
export interface PandaWikiChatCredentialStore {
  saveToken(endpointUrl: string, token: string): Promise<void>
  clearToken(endpointUrl: string): Promise<void>
  hasToken(endpointUrl: string): Promise<boolean>
}

export function createTauriPandaWikiChatCredentialStore(): PandaWikiChatCredentialStore {
  return {
    saveToken: async (endpointUrl, token) => {
      await invoke("save_pandawiki_chat_token", { endpointUrl, token })
    },
    clearToken: async (endpointUrl) => {
      await invoke("clear_pandawiki_chat_token", { endpointUrl })
    },
    hasToken: (endpointUrl) => invoke<boolean>("has_pandawiki_chat_token", { endpointUrl }),
  }
}
