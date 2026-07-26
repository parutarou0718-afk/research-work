import { describe, expect, it } from "vitest"
import { AskKnowledgeBaseService } from "./AskKnowledgeBaseService"
import type { ConversationProvider } from "@/services/providers/contracts/ConversationProvider"

describe("AskKnowledgeBaseService", () => {
  it("sends an OpenAI-compatible user message and fixes stream to false", async () => {
    const requests: Parameters<ConversationProvider["complete"]>[0][] = []
    const provider: ConversationProvider = {
      complete: async (request) => {
        requests.push(request)
        return { content: "Answer", model: "knowledge-base" }
      },
    }
    const result = await new AskKnowledgeBaseService(provider).ask("  What is in this knowledge base?  ")
    expect(result).toEqual({ kind: "answer", content: "Answer", model: "knowledge-base" })
    expect(requests).toEqual([{
      messages: [{ role: "user", content: "What is in this knowledge base?" }],
      stream: false,
    }])
  })
})
