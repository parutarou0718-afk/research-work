import { invoke } from "@tauri-apps/api/core"
import {
  ConversationProviderError,
  type ConversationProvider,
  type ConversationRequest,
  type ConversationResult,
} from "@/services/providers/contracts/ConversationProvider"
import type { PandaWikiChatConfig } from "./PandaWikiChatConfig"

export interface PandaWikiChatCommand {
  complete(input: { endpointUrl: string; model: string; timeoutSeconds: number; messages: ConversationRequest["messages"] }): Promise<ConversationResult>
}

function errorFromCommand(error: unknown): ConversationProviderError {
  const message = typeof error === "string" ? error : "PandaWiki chat request failed."
  if (message.startsWith("unauthorized")) return new ConversationProviderError("unauthorized", "The PandaWiki chat token was rejected.")
  if (message.startsWith("timeout")) return new ConversationProviderError("timeout", "PandaWiki did not answer before the request timed out.")
  if (message.startsWith("unreachable")) return new ConversationProviderError("unreachable", "PandaWiki could not be reached.")
  if (message.startsWith("invalid_response")) return new ConversationProviderError("invalid-response", "PandaWiki returned an unexpected chat response.")
  if (message.startsWith("credential_unavailable")) return new ConversationProviderError("credential-unavailable", "The Windows credential store is unavailable.")
  if (message.startsWith("not_configured")) return new ConversationProviderError("not-configured", "Configure a PandaWiki chat endpoint and token first.")
  return new ConversationProviderError("unknown", "PandaWiki chat request failed.")
}

export function createTauriPandaWikiChatCommand(): PandaWikiChatCommand {
  return {
    // Rust accepts one `input` argument. This response contains content/model
    // only; the credential remains entirely inside the Rust command.
    complete: (input) => invoke<ConversationResult>("complete_pandawiki_chat", { input }),
  }
}

export class PandaWikiOpenAIConversationProvider implements ConversationProvider {
  constructor(
    private readonly getConfig: () => PandaWikiChatConfig,
    private readonly command: PandaWikiChatCommand = createTauriPandaWikiChatCommand(),
  ) {}

  async complete(request: ConversationRequest): Promise<ConversationResult> {
    if (request.stream) throw new ConversationProviderError("stream-unsupported", "Streaming is not enabled for PandaWiki chat yet.")
    const config = this.getConfig()
    if (!config.endpointUrl) throw new ConversationProviderError("not-configured", "Configure a PandaWiki chat endpoint first.")
    try {
      return await this.command.complete({
        endpointUrl: config.endpointUrl,
        model: config.model,
        timeoutSeconds: config.timeoutSeconds,
        messages: request.messages,
      })
    } catch (error) {
      throw errorFromCommand(error)
    }
  }
}
