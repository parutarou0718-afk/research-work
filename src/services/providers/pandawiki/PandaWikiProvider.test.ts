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
})
