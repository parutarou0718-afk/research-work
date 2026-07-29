import { describe, expect, it, vi } from "vitest"
import { createMemorySessionStore } from "./session/SessionStore"
import { createPandaWikiProvider, type PandaWikiAuthGateway } from "./PandaWikiProvider"

function createGateway(): PandaWikiAuthGateway {
  return {
    setAccessToken: vi.fn(),
    login: vi.fn(async () => ({ token: "token-1" })),
    getCurrentUser: vi.fn(async () => ({ id: "1", account: "alice", role: "user", is_token: false, created_at: "2026-07-24T00:00:00.000Z" })),
    refreshToken: vi.fn(async () => { throw new Error("unsupported") }),
    listKnowledgeBases: vi.fn(async () => ([{ id: "kb-1", name: "Research", dataset_id: "dataset-1", created_at: "2026-01-01", updated_at: "2026-01-02" }])),
    getNodeTree: vi.fn(async (kbId: string) => ({ kb_id: kbId, groups: [{ nav_id: "nav-1", nav_name: "Main", position: 1, list: [{ id: "node-1", name: "Overview", parent_id: "", nav_id: "nav-1", type: "file", status: "normal", position: 1, updated_at: "2026-01-02" }] }] })),
    getNodeDetail: vi.fn(async (kbId: string, nodeId: string) => ({ id: nodeId, kb_id: kbId, name: "Overview", content: "# Overview", parent_id: "", type: "file", status: "normal", updated_at: "2026-01-02" })),
    searchKnowledgeBase: vi.fn(async () => ({ node_result: [{ node_id: "node-1", name: "Overview", summary: "A short summary", emoji: "📚", node_path_names: ["Research", "Overview"] }] })),
    updateNode: vi.fn(async () => undefined),
    importDocument: vi.fn(async () => ({ nodeId: "node-2", name: "paper.pdf" })),
  }
}

describe("PandaWiki authentication provider", () => {
  it("logs in, persists only the access token, and exposes a mapped session", async () => {
    const store = createMemorySessionStore()
    const gateway = createGateway()
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", sessionStore: store, createGateway: async () => gateway })

    const session = await provider.auth.login({ serverUrl: "https://wiki.example", account: "alice", password: "password" })

    expect(session).toEqual({ accessToken: "token-1", user: { id: "1", account: "alice", role: "user" } })
    expect(provider.auth.getSession()).toEqual(session)
    expect(await store.loadAccessToken()).toBe("token-1")
  })

  it("restores a stored token by validating the current user", async () => {
    const store = createMemorySessionStore()
    await store.saveAccessToken("saved-token")
    const gateway = createGateway()
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", sessionStore: store, createGateway: async () => gateway })

    await provider.lifecycle.initialize()

    expect(gateway.setAccessToken).toHaveBeenCalledWith("saved-token")
    expect(provider.auth.getSession()?.user.account).toBe("alice")
  })

  it("maps PandaWiki knowledge DTOs before exposing the knowledge capability", async () => {
    const gateway = createGateway()
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", createGateway: async () => gateway })

    await expect(provider.knowledge.listKnowledgeBases()).resolves.toEqual([{
      id: "kb-1", name: "Research", datasetId: "dataset-1", createdAt: "2026-01-01", updatedAt: "2026-01-02",
    }])
    await expect(provider.knowledge.getNodeTree()).resolves.toMatchObject({ knowledgeBaseId: "kb-1", roots: [{ id: "node-1", name: "Overview" }] })
    await expect(provider.knowledge.getNode("node-1")).resolves.toMatchObject({ id: "node-1", knowledgeBaseId: "kb-1", content: "# Overview" })
  })

  it("loads the tree and node detail from the explicitly selected knowledge base", async () => {
    const gateway = createGateway()
    gateway.listKnowledgeBases = vi.fn(async () => ([
      { id: "kb-1", name: "Research", dataset_id: "dataset-1", created_at: "2026-01-01", updated_at: "2026-01-02" },
      { id: "kb-2", name: "Legal", dataset_id: "dataset-2", created_at: "2026-01-01", updated_at: "2026-01-02" },
    ]))
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", createGateway: async () => gateway })

    provider.selectKnowledgeBase("kb-2")
    await provider.knowledge.getNodeTree()
    await provider.knowledge.getNode("node-1")

    expect(gateway.getNodeTree).toHaveBeenCalledWith("kb-2")
    expect(gateway.getNodeDetail).toHaveBeenCalledWith("kb-2", "node-1")
  })

  it("uses the authenticated server search gateway without accepting client permission groups", async () => {
    const gateway = createGateway()
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", createGateway: async () => gateway })

    await expect(provider.search.search("kb-1", "retrieval")).resolves.toEqual([{
      nodeId: "node-1",
      title: "Overview",
      summary: "A short summary",
      emoji: "📚",
      pathNames: ["Research", "Overview"],
    }])
    expect(gateway.searchKnowledgeBase).toHaveBeenCalledWith("kb-1", "retrieval")
  })

  it("delegates remote node saves to the server-side document-management permission boundary", async () => {
    const gateway = createGateway()
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", createGateway: async () => gateway })

    await provider.nodeEditor.updateNode({
      knowledgeBaseId: "kb-1",
      nodeId: "node-1",
      name: "Updated title",
      content: "# Updated content",
    })

    expect(gateway.updateNode).toHaveBeenCalledWith({
      knowledgeBaseId: "kb-1",
      nodeId: "node-1",
      name: "Updated title",
      content: "# Updated content",
    })
  })

  it("delegates remote document imports to the authenticated server adapter", async () => {
    const gateway = Object.assign(createGateway(), {
      importDocument: vi.fn(async () => ({ nodeId: "node-2", name: "paper.pdf" })),
    })
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", createGateway: async () => gateway })
    const documents = (provider as unknown as {
      documents: { importDocument(input: { knowledgeBaseId: string; navigationId: string; name: string; mimeType: string; bytes: Uint8Array }): Promise<{ nodeId: string; name: string }> }
    }).documents

    await expect(documents.importDocument({
      knowledgeBaseId: "kb-1",
      navigationId: "nav-1",
      name: "paper.pdf",
      mimeType: "application/pdf",
      bytes: new Uint8Array([1]),
    })).resolves.toEqual({ nodeId: "node-2", name: "paper.pdf" })
    expect(gateway.importDocument).toHaveBeenCalledWith(expect.objectContaining({ knowledgeBaseId: "kb-1" }))
  })

  it("advertises only capabilities backed by a callable client adapter", () => {
    const provider = createPandaWikiProvider({ baseUrl: "https://wiki.example", createGateway: async () => createGateway() })
    expect(provider.capabilities).toMatchObject({
      auth: true,
      documents: true,
      conversations: false,
      search: true,
      graph: false,
      templates: false,
    })
  })
})
