import { describe, expect, it } from "vitest"
import { mapKnowledgeBaseToVirtualProject } from "./PandaWikiVirtualProject"

describe("PandaWiki virtual projects", () => {
  it("maps a knowledge base without manufacturing a filesystem path", () => {
    const project = mapKnowledgeBaseToVirtualProject("lan-prod", {
      id: "kb-1",
      name: "Research",
      datasetId: "dataset-1",
      createdAt: "2026-07-29T00:00:00Z",
      updatedAt: "2026-07-29T00:00:00Z",
    })

    expect(project).toMatchObject({
      id: "pandawiki:lan-prod:kb-1",
      source: "pandawiki",
      knowledgeBaseId: "kb-1",
      scopeKey: "lan-prod:kb-1",
      capabilities: { filesystem: false, readKnowledge: true, search: true, chat: true, editNode: true },
    })
    expect("path" in project).toBe(false)
  })
})
