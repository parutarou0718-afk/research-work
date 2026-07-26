import { describe, expect, it, vi } from "vitest"
import { PandaWikiClient } from "./client"
import { PandaWikiAuthApi } from "./auth-api"

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("PandaWiki HTTP client", () => {
  it("posts the real login route and unwraps PandaWiki data", async () => {
    const fetcher = vi.fn<typeof globalThis.fetch>(async () => jsonResponse({ success: true, code: 0, data: { token: "token-1" } }))
    const api = new PandaWikiAuthApi(new PandaWikiClient("http://localhost:2443/", fetcher))

    await expect(api.login("alice", "password")).resolves.toEqual({ token: "token-1" })
    expect(fetcher).toHaveBeenCalledWith("http://localhost:2443/api/v1/user/login", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ account: "alice", password: "password" }),
    }))
  })

  it("attaches a bearer token without exposing it in errors", async () => {
    const fetcher = vi.fn<typeof globalThis.fetch>(async () => jsonResponse({ success: true, code: 0, data: { id: "1" } }))
    const client = new PandaWikiClient("https://wiki.example", fetcher)
    client.setAccessToken("secret-token")

    await client.get<{ id: string }>("/api/v1/user")

    const options = fetcher.mock.calls[0]?.[1]
    expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer secret-token")
  })

  it("maps HTTP and business authentication failures to a safe error", async () => {
    const httpClient = new PandaWikiClient("https://wiki.example", async () => jsonResponse({ message: "raw backend error" }, 401))
    const businessClient = new PandaWikiClient("https://wiki.example", async () => jsonResponse({ success: false, code: 40003, message: "trace id only" }))

    await expect(httpClient.get("/api/v1/user")).rejects.toMatchObject({ kind: "unauthorized", status: 401 })
    await expect(businessClient.get("/api/v1/user")).rejects.toMatchObject({ kind: "unauthorized", status: 200 })
  })
})
