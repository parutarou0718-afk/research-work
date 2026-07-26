import { describe, expect, it } from "vitest"
import { PandaWikiOpenAIConversationProvider } from "./PandaWikiOpenAIConversationProvider"

describe("PandaWikiOpenAIConversationProvider", () => {
  it("passes the exact configured endpoint without appending a duplicate path", async () => {
    let received: unknown
    const provider = new PandaWikiOpenAIConversationProvider(
      () => ({ endpointUrl: "https://wiki.example/share/v1/chat/completions", model: "knowledge-base", timeoutSeconds: 90, providerName: "pandawiki" }),
      { complete: async (input) => { received = input; return { content: "ok", model: input.model } } },
    )
    await provider.complete({ messages: [{ role: "user", content: "hello" }], stream: false })
    expect(received).toEqual({
      endpointUrl: "https://wiki.example/share/v1/chat/completions",
      model: "knowledge-base",
      timeoutSeconds: 90,
      messages: [{ role: "user", content: "hello" }],
    })
    expect(JSON.stringify(received)).not.toContain("X-KB-ID")
  })

  it("does not permit streaming in V1", async () => {
    const provider = new PandaWikiOpenAIConversationProvider(
      () => ({ endpointUrl: "https://wiki.example/share/v1/chat/completions", model: "knowledge-base", timeoutSeconds: 90, providerName: "pandawiki" }),
      { complete: async () => ({ content: "ok", model: "knowledge-base" }) },
    )
    await expect(provider.complete({ messages: [{ role: "user", content: "hello" }], stream: true }))
      .rejects.toMatchObject({ code: "stream-unsupported" })
  })
})
