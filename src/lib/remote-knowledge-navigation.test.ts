import { describe, expect, it } from "vitest"
import { buildRemoteKnowledgeNavigation } from "./remote-knowledge-navigation"
import { buildRemoteKnowledgeNavigationDisplay } from "./remote-knowledge-navigation"

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

describe("buildRemoteKnowledgeNavigationDisplay", () => {
  it("keeps server labels and order while adding a stable presentation style", () => {
    const sections = buildRemoteKnowledgeNavigationDisplay({
      schema: {
        version: 1,
        fields: [],
        navigation: [
          { id: "concepts", label: "自定义概念", entityTypes: ["concept"], fieldKeys: [], order: 2, enabled: true },
          { id: "overview", label: "我的概览", entityTypes: ["document"], fieldKeys: [], order: 1, enabled: true },
        ],
      },
      entities: [
        { id: "document-1", name: "文档 A", type: "document", attributes: {} },
        { id: "concept-1", name: "概念 A", type: "concept", attributes: {} },
      ],
      relations: [],
    })

    expect(sections.map((section) => [section.id, section.label, section.count, section.icon])).toEqual([
      ["overview", "我的概览", 1, "overview"],
      ["concepts", "自定义概念", 1, "concept"],
    ])
  })
})
