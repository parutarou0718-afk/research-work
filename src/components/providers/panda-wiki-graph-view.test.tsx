import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PandaWikiGraphEntityDetails } from "./panda-wiki-graph-entity-details"

const graph = {
  schema: { version: 1, fields: [], navigation: [] },
  entities: [],
  relations: [],
}

describe("PandaWiki graph entity details", () => {
  it("renders only the permission-filtered summary returned by PandaWiki", () => {
    const markup = renderToStaticMarkup(
      <PandaWikiGraphEntityDetails
        entity={{ id: "entity-1", name: "Intentional system", type: "concept", summary: "Server-provided summary.", attributes: {} }}
        graph={graph}
        onOpenEvidence={async () => undefined}
      />,
    )

    expect(markup).toContain("服务器摘要")
    expect(markup).toContain("Server-provided summary.")
    expect(markup).not.toContain("尚未生成服务器摘要")
  })

  it("uses an explicit empty state when the server has no summary", () => {
    const markup = renderToStaticMarkup(
      <PandaWikiGraphEntityDetails
        entity={{ id: "entity-1", name: "Intentional system", type: "concept", attributes: {} }}
        graph={graph}
        onOpenEvidence={async () => undefined}
      />,
    )

    expect(markup).toContain("尚未生成服务器摘要")
  })
})
