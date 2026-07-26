import type { KnowledgeModel } from "@/types/wiki"
import type { KnowledgeDTO } from "../dto/KnowledgeDTO"

export function mapKnowledgeDto(dto: KnowledgeDTO): KnowledgeModel {
  return {
    id: dto.id,
    name: dto.name,
    datasetId: dto.dataset_id,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}
