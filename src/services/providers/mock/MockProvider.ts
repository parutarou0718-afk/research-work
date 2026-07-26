import type {
  ConversationChunk,
  FileTreeModel,
  KnowledgeModel,
  NodeModel,
} from "@/types/wiki"
import type { ProviderBundle } from "../contracts/ProviderBundle"

const mockKnowledgeBases: KnowledgeModel[] = [
  { id: "mock-kb-research", name: "Research Library", datasetId: "mock-dataset-research", createdAt: "2026-07-24T00:00:00.000Z", updatedAt: "2026-07-24T00:00:00.000Z" },
  { id: "mock-kb-literature", name: "Literature Review", datasetId: "mock-dataset-literature", createdAt: "2026-07-24T00:00:00.000Z", updatedAt: "2026-07-24T00:00:00.000Z" },
  { id: "mock-kb-notes", name: "Project Notes", datasetId: "mock-dataset-notes", createdAt: "2026-07-24T00:00:00.000Z", updatedAt: "2026-07-24T00:00:00.000Z" },
]

const mockTree: FileTreeModel = {
  knowledgeBaseId: "mock-kb-research",
  roots: [{
    id: "mock-node-root",
    name: "Research",
    parentId: null,
    nodeType: "folder",
    status: "ready",
    children: [{
      id: "mock-node-methods",
      name: "Methods",
      parentId: "mock-node-root",
      nodeType: "document",
      status: "ready",
      children: [{
        id: "mock-node-protocol",
        name: "Protocol",
        parentId: "mock-node-methods",
        nodeType: "document",
        status: "ready",
        children: [{
          id: "mock-node-sampling",
          name: "Sampling notes",
          parentId: "mock-node-protocol",
          nodeType: "document",
          status: "ready",
          children: [],
        }],
      }],
    }],
  }],
}

const mockNodes: Record<string, NodeModel> = {
  "mock-node-methods": {
    id: "mock-node-methods",
    knowledgeBaseId: "mock-kb-research",
    name: "Methods",
    content: "# Methods\n\nThis is deterministic mock Markdown content.",
    parentId: "mock-node-root",
    type: "document",
    status: "ready",
    updatedAt: "2026-07-24T00:00:00.000Z",
  },
  "mock-node-protocol": {
    id: "mock-node-protocol",
    knowledgeBaseId: "mock-kb-research",
    name: "Protocol",
    content: "# Protocol\n\nMock protocol content.",
    parentId: "mock-node-methods",
    type: "document",
    status: "ready",
    updatedAt: "2026-07-24T00:00:00.000Z",
  },
}

export function createMockProvider(): ProviderBundle {
  return {
    id: "mock",
    type: "mock",
    capabilities: {
      auth: false,
      documents: false,
      conversations: true,
      search: false,
      graph: false,
      templates: false,
      providerName: "Mock",
      providerVersion: "1.0",
      providerType: "mock",
      supportsStreaming: true,
      supportsOffline: true,
    },
    lifecycle: {
      initialize: async () => {},
      dispose: async () => {},
    },
    knowledge: {
      listKnowledgeBases: async () => mockKnowledgeBases.map((knowledge) => ({ ...knowledge })),
      getNode: async (id) => {
        const node = mockNodes[id]
        if (!node) throw new Error(`Mock node not found: ${id}`)
        return { ...node }
      },
      getNodeTree: async () => structuredClone(mockTree),
    },
  }
}

export async function* streamMockConversation(conversationId: string): AsyncGenerator<ConversationChunk> {
  yield { conversationId, content: "This is a ", done: false }
  yield { conversationId, content: "mock response.", done: true }
}
