import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { EntityModel, KnowledgeGraphModel } from "@/types/wiki"

vi.mock("@react-sigma/core", () => ({
  SigmaContainer: () => null,
  useLoadGraph: () => () => undefined,
  useRegisterEvents: () => () => undefined,
  useSigma: () => ({ getCamera: () => ({}), getContainer: () => ({ style: {} }) }),
}))

import { EntityDetails } from "./panda-wiki-graph-view"

const graph: KnowledgeGraphModel = {
  schema: { version: 1, fields: [], navigation: [] },
  entities: [],
  relations: [{
    id: "relation-1",
    sourceId: "entity-1",
    targetId: "entity-2",
    type: "knows",
    evidence: [{ nodeId: "node-1", nodeReleaseId: "release-1", excerpt: "来源证据" }],
  }],
}

function renderDetails(summary?: string) {
  const entity: EntityModel = {
    id: "entity-1",
    name: "Rint Sybesma",
    type: "person",
    summary,
    attributes: { affiliation: "Leiden University" },
  }
  return renderToStaticMarkup(<EntityDetails entity={entity} graph={graph} onOpenEvidence={async () => undefined} />)
}

describe("EntityDetails", () => {
  it("renders the text-only server analysis between attributes and evidence", () => {
    const markup = renderDetails("该实体的摘要仅由服务器在可见来源范围内提供。")

    expect(markup).toContain("服务器分析")
    expect(markup).toContain("该实体的摘要仅由服务器在可见来源范围内提供。")
    expect(markup.indexOf("Leiden University")).toBeLessThan(markup.indexOf("服务器分析"))
    expect(markup.indexOf("服务器分析")).toBeLessThan(markup.indexOf("来源证据"))
    expect(markup.slice(markup.indexOf("服务器分析"), markup.indexOf("来源证据"))).not.toContain("button")
  })

  it("renders a neutral server-summary empty state", () => {
    const markup = renderDetails("")

    expect(markup).toContain("服务器分析")
    expect(markup).toContain("暂无服务器摘要")
  })
})
