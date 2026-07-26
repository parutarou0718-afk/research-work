import type { DocumentModel, DocumentStatus } from "@/types/wiki"
import type { DocumentDTO, UploadStatusDTO } from "../dto/DocumentDTO"

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
