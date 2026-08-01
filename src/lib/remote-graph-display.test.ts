import { describe, expect, it } from "vitest"
import { applyRemoteGraphFilters, buildRemoteGraphDisplay } from "./remote-graph-display"

const graph = {
  schema: { version: 1, fields: [], navigation: [] },
  entities: [
    { id: "person-1", name: "Ada Lovelace", type: "person", attributes: {} },
    { id: "concept-1", name: "Causality", type: "concept", attributes: {} },
  ],
  relations: [{ id: "r-1", sourceId: "person-1", targetId: "concept-1", type: "mentions", evidence: [] }],
}

describe("remote graph display", () => {
  it("maps only server-returned graph facts to stable visual data", () => {
    const display = buildRemoteGraphDisplay(graph)

    expect(display.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "person-1", color: "#60a5fa" }),
      expect.objectContaining({ id: "concept-1", color: "#c084fc" }),
    ]))
    expect(display.edges).toEqual([expect.objectContaining({ id: "r-1", sourceId: "person-1", targetId: "concept-1" })])
  })

  it("filters by search text and selected types without retaining orphaned edges", () => {
    const display = buildRemoteGraphDisplay(graph)
    const filtered = applyRemoteGraphFilters(display, { query: "ada", types: new Set(["person", "concept"]) })

    expect(filtered.nodes.map((node) => node.id)).toEqual(["person-1"])
    expect(filtered.edges).toEqual([])
  })
})
