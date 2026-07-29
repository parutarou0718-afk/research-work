import { describe, expect, it } from "vitest"
import { mapKnowledgeSearchDto } from "./KnowledgeSearchMapper"

describe("mapKnowledgeSearchDto", () => {
  it("maps server search hits without exposing transport field names", () => {
    expect(mapKnowledgeSearchDto({
      node_result: [{
        node_id: "node-1",
        name: "Research overview",
        summary: "A short summary",
        emoji: "📚",
        node_path_names: ["Research", "Overview"],
      }],
    })).toEqual([{
      nodeId: "node-1",
      title: "Research overview",
      summary: "A short summary",
      emoji: "📚",
      pathNames: ["Research", "Overview"],
    }])
  })
})
