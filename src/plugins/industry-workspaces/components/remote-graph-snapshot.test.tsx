import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { KnowledgeGraphModel } from "@/types/wiki"
import { RemoteGraphSnapshotContent } from "./remote-graph-snapshot"

const graph: KnowledgeGraphModel = {
  schema: { version: 1, fields: [], navigation: [] },
  entities: [
    { id: "case-1", name: "Contract dispute", type: "event", attributes: { event_date: "2026-08-01" } },
    { id: "company-1", name: "Acme Holdings", type: "organization", attributes: { risk_level: "high" } },
  ],
  relations: [],
}

describe("RemoteGraphSnapshotContent", () => {
  it("renders evidence events supplied by the server graph", () => {
    const markup = renderToStaticMarkup(<RemoteGraphSnapshotContent graph={graph} mode="legal-timeline" />)

    expect(markup).toContain("Evidence timeline")
    expect(markup).toContain("Contract dispute")
  })

  it("explains missing configurable data without inventing a local result", () => {
    const markup = renderToStaticMarkup(<RemoteGraphSnapshotContent graph={graph} mode="investment-risks" />)

    expect(markup).toContain("Acme Holdings")
    expect(markup).not.toContain("No server risk facts are available yet.")
  })
})
