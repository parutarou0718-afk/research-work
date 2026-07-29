import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import type { SearchProvider } from "@/services/providers/contracts/SearchProvider"
import { PandaWikiSearchView } from "./panda-wiki-search-view"

const knowledge: KnowledgeProvider = {
  listKnowledgeBases: async () => [],
  getNodeTree: async () => ({ knowledgeBaseId: "kb-1", roots: [] }),
  getNode: async () => { throw new Error("not used during initial render") },
}

const search: SearchProvider = {
  search: async () => [],
}

describe("PandaWikiSearchView", () => {
  it("renders a dedicated server-search surface instead of the local filesystem search", () => {
    const markup = renderToStaticMarkup(
      <PandaWikiSearchView knowledgeProvider={knowledge} searchProvider={search} />,
    )

    expect(markup).toContain("Search PandaWiki knowledge")
    expect(markup).toContain("Search runs on the server with your PandaWiki permissions")
    expect(markup).not.toContain("Images")
  })
})
