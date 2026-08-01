import { describe, expect, it, vi } from "vitest"
import { PandaWikiClient } from "./client"
import { PandaWikiPluginRecordApi } from "./plugin-record-api"

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), { headers: { "Content-Type": "application/json" } })
}

describe("PandaWiki plugin record API", () => {
  it("uses the authenticated generic record route without client-side permission fields", async () => {
    const fetcher = vi.fn(async () => jsonResponse([]))
    const client = new PandaWikiClient("https://wiki.example", fetcher)
    client.setAccessToken("session-token")
    const api = new PandaWikiPluginRecordApi(client)

    await api.list("kb-1", "official.submission-management", "submission")

    expect(fetcher).toHaveBeenCalledWith(
      "https://wiki.example/api/v1/knowledge_base/plugin-records?kb_id=kb-1&plugin_id=official.submission-management&record_type=submission",
      expect.objectContaining({ method: "GET" }),
    )
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("group_ids")
  })
})
