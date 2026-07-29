import { describe, expect, it, vi } from "vitest"
import { PandaWikiClient } from "./client"
import { PandaWikiDocumentApi } from "./document-api"

function response(data: unknown): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { "Content-Type": "application/json" },
  })
}

describe("PandaWiki document API", () => {
  it("imports a desktop-selected document through the authenticated server pipeline", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response({ key: "uploads/a.pdf", filename: "a.pdf" }))
      .mockResolvedValueOnce(response({
        id: "parse-1",
        docs: { children: [{ value: { id: "parsed-1", title: "a.pdf", file: true, file_type: "pdf" } }] },
      }))
      .mockResolvedValueOnce(response({ task_id: "task-1" }))
      .mockResolvedValueOnce(response({ status: "completed", content: "# Parsed document" }))
      .mockResolvedValueOnce(response({ id: "node-1" }))
    const client = new PandaWikiClient("https://wiki.example", fetcher)
    client.setAccessToken("management-session")
    const api = new PandaWikiDocumentApi(client, { pollIntervalMs: 0 })

    await expect(api.importDocument({
      knowledgeBaseId: "kb-1",
      navigationId: "nav-1",
      name: "a.pdf",
      mimeType: "application/pdf",
      bytes: new Uint8Array([1, 2, 3]),
    })).resolves.toEqual({ nodeId: "node-1", name: "a.pdf" })

    expect(fetcher).toHaveBeenNthCalledWith(1,
      "https://wiki.example/api/v1/file/upload",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    )
    const uploadInit = fetcher.mock.calls[0][1] as RequestInit
    expect(new Headers(uploadInit.headers).has("Content-Type")).toBe(false)
    expect(new Headers(uploadInit.headers).get("Authorization")).toBe("Bearer management-session")
    expect((uploadInit.body as FormData).get("kb_id")).toBe("kb-1")

    expect(fetcher).toHaveBeenNthCalledWith(2,
      "https://wiki.example/api/v1/crawler/parse",
      expect.objectContaining({ body: JSON.stringify({ key: "uploads/a.pdf", kb_id: "kb-1", crawler_source: "file", filename: "a.pdf" }) }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(3,
      "https://wiki.example/api/v1/crawler/export",
      expect.objectContaining({ body: JSON.stringify({ kb_id: "kb-1", id: "parse-1", doc_id: "parsed-1", file_type: "pdf" }) }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(4,
      "https://wiki.example/api/v1/crawler/result?task_id=task-1",
      expect.objectContaining({ method: "GET" }),
    )
    expect(fetcher).toHaveBeenNthCalledWith(5,
      "https://wiki.example/api/v1/node",
      expect.objectContaining({ body: JSON.stringify({ kb_id: "kb-1", nav_id: "nav-1", type: 2, name: "a.pdf", content: "# Parsed document", content_type: "pdf" }) }),
    )
  })
})
