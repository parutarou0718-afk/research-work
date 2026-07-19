import { describe, expect, it } from "vitest"
import { buildRelatedKnowledgeOptions, suggestRelatedKnowledgeOptions } from "./related-knowledge-options"
import { buildProjectPathIndexFromTree } from "@/lib/wiki-page-resolver"

describe("related knowledge options", () => {
  it("lists wiki markdown pages as selectable related knowledge", () => {
    const index = buildProjectPathIndexFromTree([
      {
        name: "wiki",
        path: "/project/wiki",
        is_dir: true,
        children: [
          { name: "index.md", path: "/project/wiki/index.md", is_dir: false },
          { name: "rld.md", path: "/project/wiki/entities/rld.md", is_dir: false },
          { name: "event-chain.md", path: "/project/wiki/concepts/event-chain.md", is_dir: false },
        ],
      },
      {
        name: "raw",
        path: "/project/raw",
        is_dir: true,
        children: [
          { name: "paper.docx", path: "/project/raw/sources/paper.docx", is_dir: false },
        ],
      },
    ])

    expect(buildRelatedKnowledgeOptions("/project", index)).toEqual([
      { path: "/project/wiki/concepts/event-chain.md", target: "wiki/concepts/event-chain.md", title: "event-chain" },
      { path: "/project/wiki/entities/rld.md", target: "wiki/entities/rld.md", title: "rld" },
    ])
  })

  it("suggests the most relevant knowledge options from idea text without selected items", () => {
    const options = [
      { path: "/project/wiki/entities/rld.md", target: "wiki/entities/rld.md", title: "RLD" },
      { path: "/project/wiki/concepts/event-chain.md", target: "wiki/concepts/event-chain.md", title: "Event Chain" },
      { path: "/project/wiki/concepts/chomsky.md", target: "wiki/concepts/chomsky.md", title: "Chomsky" },
      { path: "/project/wiki/concepts/syntax.md", target: "wiki/concepts/syntax.md", title: "Syntax" },
    ]

    expect(suggestRelatedKnowledgeOptions({
      title: "RLD and event chains",
      content: "A syntax idea about resultative complements and event chain structure.",
      options,
      selectedTargets: new Set(["wiki/entities/rld.md"]),
      limit: 2,
    })).toEqual([
      { path: "/project/wiki/concepts/event-chain.md", target: "wiki/concepts/event-chain.md", title: "Event Chain" },
      { path: "/project/wiki/concepts/syntax.md", target: "wiki/concepts/syntax.md", title: "Syntax" },
    ])
  })
})
