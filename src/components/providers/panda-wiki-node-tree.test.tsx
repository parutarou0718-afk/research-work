import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { PandaWikiNodeTree } from "./panda-wiki-node-tree"

describe("PandaWikiNodeTree", () => {
  it("renders mapped remote nodes without requiring a filesystem path", () => {
    const markup = renderToStaticMarkup(
      <PandaWikiNodeTree
        roots={[{
          id: "node-1",
          name: "Remote overview",
          parentId: null,
          nodeType: "file",
          status: "normal",
          children: [],
        }]}
        selectedNodeId={null}
        onSelect={vi.fn()}
      />,
    )

    expect(markup).toContain("Remote overview")
    expect(markup).not.toContain("path=")
  })
})
