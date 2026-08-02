import { describe, expect, it } from "vitest"
import type { PandaWikiVirtualProject } from "@/domain/projects"
import { getVisibleSuiteMenuItems, WORKSPACE_SUITES } from "./workspace-suites"

const remoteProject: PandaWikiVirtualProject = {
  id: "pandawiki:server-a:kb-1",
  source: "pandawiki",
  name: "Legal knowledge base",
  connectionId: "server-a",
  knowledgeBaseId: "kb-1",
  scopeKey: "server-a:kb-1",
  capabilities: {
    readKnowledge: true,
    search: true,
    chat: true,
    editNode: false,
    upload: false,
    conversationHistory: false,
    graph: true,
    filesystem: false,
  },
}

describe("industry workspace suites", () => {
  it("preinstalls research, legal, investment, and business suites", () => {
    expect(WORKSPACE_SUITES.map((suite) => suite.id)).toEqual([
      "research",
      "legal",
      "investment",
      "business",
    ])
  })

  it("keeps only supported remote actions visible", () => {
    const research = WORKSPACE_SUITES[0]
    const visible = getVisibleSuiteMenuItems(research, remoteProject)

    expect(visible).toContainEqual(expect.objectContaining({ id: "graph", targetView: "graph" }))
    expect(visible).toContainEqual(expect.objectContaining({ id: "search", targetView: "search" }))
    expect(visible).not.toContainEqual(expect.objectContaining({ id: "documents", targetView: "sources" }))
  })
})
