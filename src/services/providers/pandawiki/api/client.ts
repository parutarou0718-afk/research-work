import { getHttpFetch } from "@/lib/tauri-fetch"

export type PandaWikiErrorKind = "unauthorized" | "forbidden" | "not-found" | "network" | "server" | "invalid-response"

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

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "")
}

function toErrorKind(status: number, code?: number): PandaWikiErrorKind {
  if (status === 401 || code === 40003) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404 || code === 40004) return "not-found"
  return "server"
}

export class PandaWikiClient {
  private accessToken: string | null = null

  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: Fetcher,
  ) {}

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

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set("Accept", "application/json")
    if (this.accessToken) headers.set("Authorization", `Bearer ${this.accessToken}`)

    let response: Response
    try {
      response = await this.fetcher(`${normalizeBaseUrl(this.baseUrl)}${path}`, { ...init, headers })
    } catch {
      throw new PandaWikiApiError("network", 0)
    }

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
