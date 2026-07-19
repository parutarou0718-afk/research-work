import { describe, expect, it, vi } from "vitest"
import { suggestIdeaRelatedKnowledge } from "./idea-related-suggestions"
import type { RelatedKnowledgeOption } from "@/components/ideas/related-knowledge-options"

const OPTIONS: RelatedKnowledgeOption[] = [
  { path: "/project/wiki/entities/rld.md", target: "wiki/entities/rld.md", title: "RLD" },
  { path: "/project/wiki/concepts/event-chain.md", target: "wiki/concepts/event-chain.md", title: "Event Chain" },
  { path: "/project/wiki/concepts/syntax.md", target: "wiki/concepts/syntax.md", title: "Syntax" },
]

describe("idea related suggestions", () => {
  it("uses existing wiki search results to rank related knowledge suggestions", async () => {
    const searchWiki = vi.fn().mockResolvedValue([
      { path: "/project/wiki/concepts/syntax.md", title: "Syntax", snippet: "", titleMatch: false, score: 3, images: [] },
      { path: "/project/wiki/entities/rld.md", title: "RLD", snippet: "", titleMatch: true, score: 2, images: [] },
      { path: "/project/raw/sources/paper.docx", title: "paper", snippet: "", titleMatch: false, score: 1, images: [] },
    ])

    await expect(suggestIdeaRelatedKnowledge({
      projectPath: "/project",
      title: "RLD",
      content: "syntax relation",
      options: OPTIONS,
      selectedTargets: new Set(["wiki/entities/rld.md"]),
      searchWiki,
    })).resolves.toEqual([
      { path: "/project/wiki/concepts/syntax.md", target: "wiki/concepts/syntax.md", title: "Syntax" },
    ])
    expect(searchWiki).toHaveBeenCalledWith("/project", "RLD\n\nsyntax relation")
  })

  it("falls back to local deterministic suggestions when wiki search fails", async () => {
    const searchWiki = vi.fn().mockRejectedValue(new Error("embedding unavailable"))

    await expect(suggestIdeaRelatedKnowledge({
      projectPath: "/project",
      title: "Event chain",
      content: "RLD and syntax",
      options: OPTIONS,
      searchWiki,
      limit: 2,
    })).resolves.toEqual([
      { path: "/project/wiki/concepts/event-chain.md", target: "wiki/concepts/event-chain.md", title: "Event Chain" },
      { path: "/project/wiki/entities/rld.md", target: "wiki/entities/rld.md", title: "RLD" },
    ])
  })
})
