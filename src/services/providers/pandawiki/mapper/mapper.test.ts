import { describe, expect, it } from "vitest"
import { mapKnowledgeDto } from "./KnowledgeMapper"
import { mapConversationDto, fromStreamChunk } from "./ConversationMapper"
import { mapDocumentDto, mapUploadStatusDto } from "./DocumentMapper"
import { mapEntityDto, mapRelationDto } from "./GraphMapper"
import { mapNodeDto, mapNodeTreeDto } from "./NodeMapper"

describe("PandaWiki mappers", () => {
  it("maps a knowledge-base DTO without exposing transport field names", () => {
    expect(mapKnowledgeDto({
      id: "kb-1",
      name: "Research",
      dataset_id: "dataset-1",
      created_at: "2026-07-24T00:00:00.000Z",
      updated_at: "2026-07-24T01:00:00.000Z",
    })).toEqual({
      id: "kb-1",
      name: "Research",
      datasetId: "dataset-1",
      createdAt: "2026-07-24T00:00:00.000Z",
      updatedAt: "2026-07-24T01:00:00.000Z",
    })
  })

  it("maps a node tree from PandaWiki nav groups and parent ids", () => {
    const tree = mapNodeTreeDto({
      kb_id: "kb-1",
      groups: [{
        nav_id: "nav-1",
        nav_name: "Papers",
        position: 1,
        list: [
          { id: "root", name: "Root", type: "folder", status: "released", parent_id: "", nav_id: "nav-1", position: 1, updated_at: "2026-07-24T00:00:00.000Z" },
          { id: "child", name: "Child", type: "document", status: "released", parent_id: "root", nav_id: "nav-1", position: 2, updated_at: "2026-07-24T00:00:00.000Z" },
        ],
      }],
    })

    expect(tree.knowledgeBaseId).toBe("kb-1")
    expect(tree.roots).toEqual([{
      id: "root",
      name: "Root",
      parentId: null,
      nodeType: "folder",
      status: "released",
      children: [{
        id: "child",
        name: "Child",
        parentId: "root",
        nodeType: "document",
        status: "released",
        children: [],
      }],
    }])
  })

  it("maps transport DTOs through each remaining mapper", () => {
    expect(mapNodeDto({ id: "n", kb_id: "kb", name: "Node", content: "# Markdown", parent_id: "", type: "document", status: "released", updated_at: "2026-07-24T00:00:00.000Z" }).knowledgeBaseId).toBe("kb")
    expect(mapConversationDto({ id: "c", kb_id: "kb", subject: "Question", updated_at: "2026-07-24T00:00:00.000Z" }).title).toBe("Question")
    expect(fromStreamChunk({ conversation_id: "c", content: "Hello", done: false })).toEqual({ conversationId: "c", content: "Hello", done: false })
    expect(mapDocumentDto({ id: "d", kb_id: "kb", name: "file.pdf", status: "ready", updated_at: "2026-07-24T00:00:00.000Z" }).status).toBe("ready")
    expect(mapUploadStatusDto({ status: "processing" })).toBe("processing")
    expect(mapEntityDto({ id: "e", name: "Alice", type: "person" })).toEqual({ id: "e", name: "Alice", type: "person" })
    expect(mapRelationDto({ id: "r", source_id: "e", target_id: "f", type: "knows" })).toEqual({ id: "r", sourceId: "e", targetId: "f", type: "knows" })
  })
})
