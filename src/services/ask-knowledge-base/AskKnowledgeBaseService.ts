import {
  ConversationProviderError,
  type ConversationProvider,
} from "@/services/providers/contracts/ConversationProvider"

export type AskKnowledgeBaseResult =
  | { kind: "answer"; content: string; model: string }
  | { kind: "error"; code: ConversationProviderError["code"]; message: string }

export class AskKnowledgeBaseService {
  constructor(private readonly provider: ConversationProvider) {}

  async ask(question: string): Promise<AskKnowledgeBaseResult> {
    const content = question.trim()
    if (!content) return { kind: "error", code: "not-configured", message: "Enter a question first." }
    try {
      const result = await this.provider.complete({
        messages: [{ role: "user", content }],
        stream: false,
      })
      if (!result.content.trim()) return { kind: "error", code: "invalid-response", message: "PandaWiki returned an empty answer." }
      return { kind: "answer", content: result.content, model: result.model }
    } catch (error) {
      if (error instanceof ConversationProviderError) return { kind: "error", code: error.code, message: error.message }
      return { kind: "error", code: "unknown", message: "PandaWiki chat request failed." }
    }
  }
}
