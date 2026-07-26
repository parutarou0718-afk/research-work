import { describe, expect, it } from "vitest"
import type { ProviderBundle } from "./ProviderBundle"

describe("provider contracts", () => {
  it("requires knowledge while keeping authentication optional", () => {
    const bundle: ProviderBundle = {
      id: "mock",
      type: "mock",
      capabilities: {
        auth: false,
        documents: false,
        conversations: false,
        search: false,
        graph: false,
        templates: false,
        providerName: "Mock",
        providerVersion: "1.0",
        providerType: "mock",
        supportsStreaming: true,
        supportsOffline: true,
      },
      lifecycle: {
        initialize: async () => {},
        dispose: async () => {},
      },
      knowledge: {
        listKnowledgeBases: async () => [],
        getNode: async () => ({
          id: "node-1",
          knowledgeBaseId: "kb-1",
          name: "Node",
          content: "",
          parentId: null,
          type: "document",
          status: "ready",
          updatedAt: "2026-07-24T00:00:00.000Z",
        }),
        getNodeTree: async () => ({ knowledgeBaseId: "kb-1", roots: [] }),
      },
    }

    expect(bundle.knowledge).toBeDefined()
    expect(bundle.auth).toBeUndefined()
  })
})
