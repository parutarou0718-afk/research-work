import { describe, expect, it } from "vitest"
import { __pandaWikiChatConfigTest, validatePandaWikiChatEndpoint } from "./PandaWikiChatConfig"

describe("PandaWiki chat configuration", () => {
  it("persists only non-secret endpoint settings", () => {
    const config = __pandaWikiChatConfigTest.normalizeConfig({
      endpointUrl: " https://wiki.example/v1/chat/completions ",
      model: "knowledge-base",
      timeoutSeconds: 90,
      // A malformed persisted secret must not be adopted by this configuration type.
      token: "must-not-be-persisted",
    } as never)
    expect(config).toEqual({
      endpointUrl: "https://wiki.example/v1/chat/completions",
      model: "knowledge-base",
      timeoutSeconds: 90,
      providerName: "pandawiki",
    })
    expect(JSON.stringify(config)).not.toContain("token")
  })

  it("requires a complete endpoint instead of allowing path construction", () => {
    expect(validatePandaWikiChatEndpoint("https://wiki.example/share/v1/chat/completions")).toBeNull()
    expect(validatePandaWikiChatEndpoint("https://wiki.example/share/v1")).toContain("complete")
  })
})
