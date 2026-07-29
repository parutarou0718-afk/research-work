import { describe, expect, it, vi } from "vitest"
import { PandaWikiClient } from "./client"
import { PandaWikiNodeApi } from "./node-api"

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  })
}

describe("PandaWiki node API", () => {
  it("updates only the selected remote node fields through the authenticated endpoint", async () => {
    const fetcher = vi.fn(async () => jsonResponse(null))
    const client = new PandaWikiClient("https://wiki.example", fetcher)
    client.setAccessToken("session-token")
    const api = new PandaWikiNodeApi(client)

    await expect(api.updateNode({
      knowledgeBaseId: "kb-1",
      nodeId: "node-1",
      name: "Updated title",
      content: "# Updated content",
    })).resolves.toBeUndefined()

    expect(fetcher).toHaveBeenCalledWith(
      "https://wiki.example/api/v1/node/detail",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          kb_id: "kb-1",
          id: "node-1",
          name: "Updated title",
          content: "# Updated content",
        }),
      }),
    )
  })
})
