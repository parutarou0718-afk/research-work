import { beforeEach, describe, expect, it } from "vitest"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import { useWikiStore } from "./wiki-store"

function createKnowledgeProvider(): KnowledgeProvider {
  return {
    listKnowledgeBases: async () => [{ id: "kb-1", name: "Research", datasetId: "dataset-1", createdAt: "2026-01-01", updatedAt: "2026-01-02" }],
    getNodeTree: async () => ({ knowledgeBaseId: "kb-1", roots: [{ id: "node-1", name: "Overview", parentId: null, nodeType: "file", status: "normal", children: [] }] }),
    getNode: async (id) => ({ id, knowledgeBaseId: "kb-1", name: "Overview", content: "# Overview", parentId: null, nodeType: "file", type: "file", status: "normal", updatedAt: "2026-01-02" }),
  }
}

describe("provider knowledge store", () => {
  beforeEach(() => useWikiStore.getState().clearProviderKnowledge())

  it("loads provider models for the knowledge-base list and tree", async () => {
    await useWikiStore.getState().loadProviderKnowledge(createKnowledgeProvider())

    expect(useWikiStore.getState()).toMatchObject({
      providerKnowledgeStatus: "ready",
      activeProviderKnowledgeBaseId: "kb-1",
      providerKnowledgeBases: [{ id: "kb-1", datasetId: "dataset-1" }],
      providerFileTree: { knowledgeBaseId: "kb-1", roots: [{ id: "node-1" }] },
    })
  })

  it("loads and caches a selected provider node without using DTOs", async () => {
    const provider = createKnowledgeProvider()
    await useWikiStore.getState().loadProviderKnowledge(provider)

    await useWikiStore.getState().loadProviderNode(provider, "node-1")

    expect(useWikiStore.getState().providerNodesById["node-1"]).toMatchObject({ content: "# Overview", knowledgeBaseId: "kb-1" })
  })

  it("keeps a clear provider error when the backend load fails", async () => {
    await useWikiStore.getState().loadProviderKnowledge({
      ...createKnowledgeProvider(),
      listKnowledgeBases: async () => { throw new Error("network") },
    })

    expect(useWikiStore.getState()).toMatchObject({ providerKnowledgeStatus: "error", providerKnowledgeError: "Unable to load PandaWiki knowledge." })
  })
})
