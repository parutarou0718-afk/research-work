import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { PandaWikiVirtualProject } from "@/domain/projects"
import { RemoteProjectHome } from "./remote-project-home"

const project: PandaWikiVirtualProject = {
  id: "pandawiki:server:kb-1",
  source: "pandawiki",
  name: "Research",
  connectionId: "server",
  knowledgeBaseId: "kb-1",
  scopeKey: "server:kb-1",
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

describe("RemoteProjectHome", () => {
  it("offers only connected PandaWiki workspace actions", () => {
    const markup = renderToStaticMarkup(<RemoteProjectHome project={project} onNavigate={() => undefined} />)

    expect(markup).toContain("Browse knowledge")
    expect(markup).toContain("Search knowledge")
    expect(markup).toContain("Ask knowledge base")
    expect(markup).toContain("Workspace plugins")
    expect(markup).toContain("PandaWiki settings")
    expect(markup).not.toContain("Remote document browsing will appear")
  })
})
