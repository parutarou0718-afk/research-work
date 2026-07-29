import type { DocumentModel, DocumentStatus } from "@/types/wiki"
import type { DocumentDTO, PandaWikiCrawlerChildDTO, PandaWikiCrawlerParseDTO, UploadStatusDTO } from "../dto/DocumentDTO"

const documentStatuses: readonly DocumentStatus[] = ["pending", "processing", "ready", "failed"]

export function mapUploadStatusDto(dto: UploadStatusDTO): DocumentStatus {
  return documentStatuses.includes(dto.status as DocumentStatus)
    ? dto.status as DocumentStatus
    : "failed"
}

export function mapDocumentDto(dto: DocumentDTO): DocumentModel {
  return {
    id: dto.id,
    knowledgeBaseId: dto.kb_id,
    name: dto.name,
    status: mapUploadStatusDto(dto),
    updatedAt: dto.updated_at,
  }
}

/** Provider-facing parsed-file identity, with no transport-specific fields. */
export interface ParsedDocumentForImport {
  documentId: string
  name: string
  fileType: string
}

function findImportableFile(child: PandaWikiCrawlerChildDTO): ParsedDocumentForImport | null {
  const value = child.value
  if (value?.file === true && typeof value.id === "string" && typeof value.title === "string") {
    return {
      documentId: value.id,
      name: value.title,
      fileType: typeof value.file_type === "string" ? value.file_type : "",
    }
  }

  for (const nextChild of child.children ?? []) {
    const result = findImportableFile(nextChild)
    if (result) return result
  }
  return null
}

/**
 * Selects the server parser's first concrete file. Folder-only and malformed
 * responses fail closed rather than creating a node with guessed content.
 */
export function mapParsedDocumentForImport(dto: PandaWikiCrawlerParseDTO): ParsedDocumentForImport {
  const result = findImportableFile(dto.docs)
  if (!result) {
    throw new Error("PandaWiki parser response did not contain an importable file")
  }
  return result
}
