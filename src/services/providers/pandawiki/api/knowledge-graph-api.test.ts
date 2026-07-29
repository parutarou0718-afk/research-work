import { describe, expect, it, vi } from "vitest"
import { PandaWikiClient } from "./client"
import { PandaWikiKnowledgeGraphApi } from "./knowledge-graph-api"

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  })
}

describe("PandaWiki knowledge graph API", () => {
  it("uses the authenticated graph route without client permission groups", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ entities: [], relations: [] }))
    const client = new PandaWikiClient("https://wiki.example", fetcher)
    client.setAccessToken("session-token")

    await expect(new PandaWikiKnowledgeGraphApi(client).getGraph("kb-1")).resolves.toEqual({ entities: [], relations: [] })

    expect(fetcher).toHaveBeenCalledWith(
      "https://wiki.example/api/v1/knowledge_base/graph?kb_id=kb-1",
      expect.objectContaining({ method: "GET" }),
    )
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("group_ids")
  })
})
