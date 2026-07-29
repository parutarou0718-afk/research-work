import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { NodeEditorProvider } from "@/services/providers/contracts/NodeEditorProvider"
import { PandaWikiNodeEditor } from "./panda-wiki-node-editor"

const nodeEditor: NodeEditorProvider = { updateNode: async () => undefined }

describe("PandaWikiNodeEditor", () => {
  it("renders a separate server-backed editor without any local file path", () => {
    const markup = renderToStaticMarkup(
      <PandaWikiNodeEditor
        node={{
          id: "node-1",
          knowledgeBaseId: "kb-1",
          name: "Remote overview",
          content: "# Trusted content",
          parentId: null,
          type: "file",
          status: "normal",
          updatedAt: "2026-07-29",
        }}
        nodeEditor={nodeEditor}
        onCancel={() => undefined}
        onSaved={() => undefined}
      />,
    )

    expect(markup).toContain("Save to PandaWiki")
    expect(markup).toContain("Remote overview")
    expect(markup).not.toContain("project.path")
  })
})
