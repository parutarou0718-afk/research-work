import { getHttpFetch } from "@/lib/tauri-fetch"

export type PandaWikiErrorKind = "bad-request" | "unauthorized" | "forbidden" | "not-found" | "tls" | "network" | "server" | "invalid-response"

export interface PandaWikiRequestDiagnostic {
  phase: "request" | "response" | "error"
  origin: string
  path: string
  status?: number
  errorKind?: PandaWikiErrorKind
}

export class PandaWikiApiError extends Error {
  constructor(
    public readonly kind: PandaWikiErrorKind,
    public readonly status: number,
  ) {
    super(kind)
    this.name = "PandaWikiApiError"
  }
}

interface PandaWikiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

type Fetcher = typeof globalThis.fetch

export function normalizePandaWikiServerAddress(serverAddress: string): string {
  const url = new URL(serverAddress.trim())
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("PandaWiki server must use HTTP or HTTPS")
  // A login provider is configured with a server origin, not an API endpoint.
  // Keeping the supplied protocol prevents accidental HTTPS-to-HTTP downgrade.
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("PandaWiki server address must not contain a path, query, or fragment")
  return url.origin
}

function toErrorKind(status: number, code?: number): PandaWikiErrorKind {
  if (status === 400) return "bad-request"
  if (status === 401 || code === 40003) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404 || code === 40004) return "not-found"
  return "server"
}

function isTlsFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  return message.includes("certificate") || message.includes("ssl") || message.includes("tls")
}

function defaultDiagnostic(diagnostic: PandaWikiRequestDiagnostic): void {
  // Deliberately no request body, Authorization header, credentials, or response payload.
  console.info("[pandawiki-login]", diagnostic)
}

export class PandaWikiClient {
  private accessToken: string | null = null
  private readonly baseUrl: string
  private readonly diagnostic: (diagnostic: PandaWikiRequestDiagnostic) => void

  constructor(
    baseUrl: string,
    private readonly fetcher: Fetcher,
    diagnostic: (diagnostic: PandaWikiRequestDiagnostic) => void = defaultDiagnostic,
  ) {
    this.baseUrl = normalizePandaWikiServerAddress(baseUrl)
    this.diagnostic = diagnostic
  }

  static async create(baseUrl: string): Promise<PandaWikiClient> {
    return new PandaWikiClient(baseUrl, await getHttpFetch())
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" })
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set("Accept", "application/json")
    if (this.accessToken) headers.set("Authorization", `Bearer ${this.accessToken}`)

    let response: Response
    try {
      const url = new URL(path, `${this.baseUrl}/`)
      this.diagnostic({ phase: "request", origin: url.origin, path: url.pathname })
      response = await this.fetcher(url.toString(), { ...init, headers })
    } catch (error) {
      const kind = isTlsFailure(error) ? "tls" : "network"
      this.diagnostic({ phase: "error", origin: this.baseUrl, path, errorKind: kind })
      throw new PandaWikiApiError(kind, 0)
    }

    this.diagnostic({ phase: "response", origin: this.baseUrl, path, status: response.status })

    let envelope: PandaWikiEnvelope<T> | null = null
    try {
      envelope = await response.json() as PandaWikiEnvelope<T>
    } catch {
      throw new PandaWikiApiError(response.ok ? "invalid-response" : toErrorKind(response.status), response.status)
    }

    if (!response.ok || !envelope.success) {
      throw new PandaWikiApiError(toErrorKind(response.status, envelope.code), response.status)
    }
    if (envelope.data === undefined) throw new PandaWikiApiError("invalid-response", response.status)
    return envelope.data
  }
}
