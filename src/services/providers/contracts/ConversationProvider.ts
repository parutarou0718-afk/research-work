/** Transport-neutral conversation contract. It deliberately knows nothing about
 * React, Tauri, HTTP, credentials, or PandaWiki DTOs. */
export type ConversationRole = "system" | "user" | "assistant"

export interface ConversationMessage {
  role: ConversationRole
  content: string
}

export interface ConversationRequest {
  messages: ConversationMessage[]
  stream: boolean
}

export interface ConversationResult {
  content: string
  model: string
}

export type ConversationErrorCode =
  | "not-configured"
  | "credential-unavailable"
  | "unauthorized"
  | "timeout"
  | "unreachable"
  | "invalid-response"
  | "stream-unsupported"
  | "unknown"

export class ConversationProviderError extends Error {
  constructor(
    readonly code: ConversationErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "ConversationProviderError"
  }
}

export interface ConversationProvider {
  complete(request: ConversationRequest): Promise<ConversationResult>
}
