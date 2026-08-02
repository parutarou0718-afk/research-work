import { describe, expect, it } from "vitest"
import type { KnowledgeGraphModel } from "@/types/wiki"
import { buildAttributeBoard, buildAttributeTimeline, filterEntitiesByTypes } from "./graph-projections"

const graph: KnowledgeGraphModel = {
  schema: { version: 1, fields: [], navigation: [] },
  entities: [
    { id: "person-1", name: "Ada", type: "person", attributes: { risk_level: "high" } },
    { id: "event-late", name: "Hearing", type: "event", attributes: { event_date: "2026-08-12" } },
    { id: "event-early", name: "Filing", type: "event", attributes: { event_date: "2026-08-01" } },
  ],
  relations: [],
}

describe("industry graph projections", () => {
  it("filters only server-provided entity types", () => {
    expect(filterEntitiesByTypes(graph, ["person"])).toEqual([graph.entities[0]])
  })

  it("sorts configured date attributes into a timeline", () => {
    expect(buildAttributeTimeline(graph, "event_date").map((row) => row.entity.id))
      .toEqual(["event-early", "event-late"])
  })

  it("groups configured attributes into a stable board", () => {
    expect(buildAttributeBoard(graph, "risk_level").get("high")).toEqual([graph.entities[0]])
  })
})
