import { describe, expect, it, vi } from "vitest"
import { PandaWikiClient } from "./client"
import { PandaWikiKnowledgeSearchApi } from "./knowledge-search-api"

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  })
}

describe("PandaWiki knowledge search API", () => {
  it("uses the authenticated knowledge-base search route without client group ids", async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      node_result: [{
        node_id: "node-1",
        name: "Research overview",
        summary: "A safe server result.",
        emoji: "📚",
        node_path_names: ["Research", "Overview"],
      }],
    }))
    const client = new PandaWikiClient("https://wiki.example", fetcher)
    client.setAccessToken("session-token")
    const api = new PandaWikiKnowledgeSearchApi(client)

    await expect(api.search("kb-1", "retrieval")).resolves.toMatchObject({
      node_result: [{ node_id: "node-1", name: "Research overview" }],
    })

    expect(fetcher).toHaveBeenCalledWith(
      "https://wiki.example/api/v1/knowledge_base/search",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ kb_id: "kb-1", query: "retrieval" }),
      }),
    )
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("group_ids")
  })
})
