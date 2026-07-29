import { describe, expect, it } from "vitest"
import { buildRemoteKnowledgeNavigation } from "./remote-knowledge-navigation"

describe("buildRemoteKnowledgeNavigation", () => {
  it("groups only server-visible entity types and preserves schema order", () => {
    const sections = buildRemoteKnowledgeNavigation({
      schema: {
        version: 1,
        fields: [],
        navigation: [
          { id: "concepts", label: "Concepts", entityTypes: ["concept"], fieldKeys: [], order: 2, enabled: true },
          { id: "people", label: "People", entityTypes: ["person"], fieldKeys: [], order: 1, enabled: true },
          { id: "disabled", label: "Disabled", entityTypes: ["organization"], fieldKeys: [], order: 3, enabled: false },
        ],
      },
      entities: [
        { id: "person-1", name: "Ada", type: "person", attributes: {} },
        { id: "concept-1", name: "Causality", type: "concept", attributes: {} },
        { id: "hidden-1", name: "Private org", type: "organization", attributes: {} },
      ],
      relations: [],
    })

    expect(sections).toEqual([
      { id: "people", label: "People", entities: [{ id: "person-1", name: "Ada", type: "person", attributes: {} }] },
      { id: "concepts", label: "Concepts", entities: [{ id: "concept-1", name: "Causality", type: "concept", attributes: {} }] },
    ])
  })
})
