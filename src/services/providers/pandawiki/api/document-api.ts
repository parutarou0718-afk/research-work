import type { RemoteDocumentImportInput, RemoteDocumentImportResult } from "../../contracts/DocumentProvider"
import type {
  PandaWikiCrawlerExportDTO,
  PandaWikiCrawlerParseDTO,
  PandaWikiCrawlerResultDTO,
  PandaWikiNodeCreateDTO,
  PandaWikiObjectUploadDTO,
} from "../dto/DocumentDTO"
import { mapParsedDocumentForImport } from "../mapper/DocumentMapper"
import { PandaWikiApiError, PandaWikiClient } from "./client"

interface PandaWikiDocumentApiOptions {
  pollIntervalMs?: number
  maxPollAttempts?: number
  sleep?: (milliseconds: number, signal?: AbortSignal) => Promise<void>
}

function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The import was cancelled", "AbortError"))
      return
    }
    const timeout = window.setTimeout(resolve, milliseconds)
    signal?.addEventListener("abort", () => {
      window.clearTimeout(timeout)
      reject(new DOMException("The import was cancelled", "AbortError"))
    }, { once: true })
  })
}

/**
 * Authenticated PandaWiki document ingestion. The desktop supplies only a
 * transient selected-file payload; parsing, storage and permission checks all
 * remain on PandaWiki.
 */
export class PandaWikiDocumentApi {
  private readonly pollIntervalMs: number
  private readonly maxPollAttempts: number
  private readonly sleep: (milliseconds: number, signal?: AbortSignal) => Promise<void>

  constructor(private readonly client: PandaWikiClient, options: PandaWikiDocumentApiOptions = {}) {
    this.pollIntervalMs = options.pollIntervalMs ?? 1_000
    this.maxPollAttempts = options.maxPollAttempts ?? 120
    this.sleep = options.sleep ?? wait
  }

  async importDocument(input: RemoteDocumentImportInput & { signal?: AbortSignal }): Promise<RemoteDocumentImportResult> {
    const form = new FormData()
    const byteBuffer = new ArrayBuffer(input.bytes.byteLength)
    new Uint8Array(byteBuffer).set(input.bytes)
    form.append("file", new Blob([byteBuffer], { type: input.mimeType }), input.name)
    form.append("kb_id", input.knowledgeBaseId)

    const uploaded = await this.client.postForm<PandaWikiObjectUploadDTO>("/api/v1/file/upload", form, { signal: input.signal })
    const parsed = await this.client.post<PandaWikiCrawlerParseDTO>("/api/v1/crawler/parse", {
      key: uploaded.key,
      kb_id: input.knowledgeBaseId,
      crawler_source: "file",
      filename: uploaded.filename,
    })
    const parsedDocument = mapParsedDocumentForImport(parsed)
    const exported = await this.client.post<PandaWikiCrawlerExportDTO>("/api/v1/crawler/export", {
      kb_id: input.knowledgeBaseId,
      id: parsed.id,
      doc_id: parsedDocument.documentId,
      file_type: parsedDocument.fileType,
    })
    const result = await this.waitForExport(exported.task_id, input.signal)
    if (typeof result.content !== "string") throw new PandaWikiApiError("invalid-response", 200)

    const node = await this.client.post<PandaWikiNodeCreateDTO>("/api/v1/node", {
      kb_id: input.knowledgeBaseId,
      nav_id: input.navigationId,
      type: 2,
      name: parsedDocument.name,
      content: result.content,
      content_type: parsedDocument.fileType,
    })
    return { nodeId: node.id, name: parsedDocument.name }
  }

  private async waitForExport(taskId: string, signal?: AbortSignal): Promise<PandaWikiCrawlerResultDTO> {
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt += 1) {
      const result = await this.client.get<PandaWikiCrawlerResultDTO>(`/api/v1/crawler/result?task_id=${encodeURIComponent(taskId)}`, { signal })
      if (result.status === "completed") return result
      if (result.status === "failed") throw new PandaWikiApiError("server", 502)
      if (result.status !== "pending" && result.status !== "in_process") throw new PandaWikiApiError("invalid-response", 200)
      if (attempt < this.maxPollAttempts - 1) await this.sleep(this.pollIntervalMs, signal)
    }
    throw new PandaWikiApiError("server", 504)
  }
}
