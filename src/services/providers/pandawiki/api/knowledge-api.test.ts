import { describe, expect, it, vi } from "vitest"
import { PandaWikiClient } from "./client"
import { PandaWikiKnowledgeApi } from "./knowledge-api"
import { PandaWikiNodeApi } from "./node-api"

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  })
}

describe("PandaWiki knowledge API adapters", () => {
  it("loads knowledge bases from the documented list endpoint", async () => {
    const fetcher = vi.fn(async () => jsonResponse([{ id: "kb-1", name: "Research", dataset_id: "ds-1", created_at: "2026-01-01", updated_at: "2026-01-02" }]))
    const api = new PandaWikiKnowledgeApi(new PandaWikiClient("https://wiki.example", fetcher))

    await expect(api.listKnowledgeBases()).resolves.toMatchObject([{ id: "kb-1", dataset_id: "ds-1" }])
    expect(fetcher).toHaveBeenCalledWith("https://wiki.example/api/v1/knowledge_base/list", expect.objectContaining({ method: "GET" }))
  })

  it("uses the selected knowledge base when loading navigation and node content", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ nav_id: "nav-1", nav_name: "Main", position: 1, list: [] }]))
      .mockResolvedValueOnce(jsonResponse({ id: "node-1", kb_id: "kb-1", name: "Overview", content: "# Overview", parent_id: "", type: "file", status: "normal", updated_at: "2026-01-02" }))
    const api = new PandaWikiNodeApi(new PandaWikiClient("https://wiki.example", fetcher))

    await expect(api.getNodeTree("kb-1")).resolves.toMatchObject({ kb_id: "kb-1", groups: [{ nav_id: "nav-1" }] })
    await expect(api.getNodeDetail("kb-1", "node-1")).resolves.toMatchObject({ id: "node-1", kb_id: "kb-1" })

    expect(fetcher.mock.calls[0]?.[0]).toBe("https://wiki.example/api/v1/node/list/group/nav?kb_id=kb-1")
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://wiki.example/api/v1/node/detail?kb_id=kb-1&id=node-1")
  })
})
