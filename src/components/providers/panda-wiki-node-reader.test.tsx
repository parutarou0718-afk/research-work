import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PandaWikiNodeDocument } from "./panda-wiki-node-reader"

describe("PandaWikiNodeDocument", () => {
  it("renders mapped remote node content as Markdown without an editor", () => {
    const markup = renderToStaticMarkup(
      <PandaWikiNodeDocument node={{
        id: "node-1",
        knowledgeBaseId: "kb-1",
        name: "Remote overview",
        content: "# Trusted content",
        parentId: null,
        type: "file",
        status: "normal",
        updatedAt: "2026-07-29",
      }} />,
    )

    expect(markup).toContain("Remote overview")
    expect(markup).toContain("Trusted content")
    expect(markup).not.toContain("textarea")
  })
})
