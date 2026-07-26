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
  it("uses the configured HTTPS origin exactly and emits only safe diagnostics", async () => {
    const diagnostics: unknown[] = []
    const fetcher = vi.fn<typeof globalThis.fetch>(async () => jsonResponse({ success: true, data: { token: "test-token" } }))
    const api = new PandaWikiAuthApi(new PandaWikiClient(
      "https://pandawiki.docs.baizhi.cloud:2444/",
      fetcher,
      (diagnostic) => diagnostics.push(diagnostic),
    ))

    await api.login("admin", "real-password-must-not-appear")

    expect(fetcher).toHaveBeenCalledWith(
      "https://pandawiki.docs.baizhi.cloud:2444/api/v1/user/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ account: "admin", password: "real-password-must-not-appear" }),
      }),
    )
    expect(diagnostics).toEqual([
      { phase: "request", origin: "https://pandawiki.docs.baizhi.cloud:2444", path: "/api/v1/user/login" },
      { phase: "response", origin: "https://pandawiki.docs.baizhi.cloud:2444", path: "/api/v1/user/login", status: 200 },
    ])
    expect(JSON.stringify(diagnostics)).not.toContain("real-password-must-not-appear")
    expect(JSON.stringify(diagnostics)).not.toContain("test-token")
  })

  it("classifies TLS failures separately from ordinary network failures", async () => {
    const client = new PandaWikiClient("https://wiki.example", async () => {
      throw new TypeError("SSL certificate problem: unable to get local issuer certificate")
    })

    await expect(client.get("/api/v1/user")).rejects.toMatchObject({ kind: "tls", status: 0 })
  })

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
