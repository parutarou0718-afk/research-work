import { describe, expect, it } from "vitest"
import {
  buildPandaWikiProjectId,
  buildProviderScopeKey,
  isLocalProject,
  requireLocalProject,
  UnsupportedProjectOperationError,
  type PandaWikiVirtualProject,
} from "./projects"

describe("project domain", () => {
  it("includes the connection in a PandaWiki virtual-project id", () => {
    expect(buildPandaWikiProjectId("server-a", "kb-1"))
      .toBe("pandawiki:server-a:kb-1")
    expect(buildPandaWikiProjectId("server-b", "kb-1"))
      .not.toBe(buildPandaWikiProjectId("server-a", "kb-1"))
  })

  it("uses connection and knowledge-base identity for request scope", () => {
    expect(buildProviderScopeKey("server-a", "kb-1")).toBe("server-a:kb-1")
  })

  it("rejects a remote project before any filesystem operation", () => {
    const remote: PandaWikiVirtualProject = {
      id: "pandawiki:server-a:kb-1",
      source: "pandawiki",
      name: "Legal KB",
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
        graph: false,
        filesystem: false,
      },
    }

    expect(isLocalProject(remote)).toBe(false)
    expect(() => requireLocalProject(remote, "open project folder"))
      .toThrow(UnsupportedProjectOperationError)
  })
})
