import type { EntityModel, KnowledgeGraphModel, RelationModel } from "@/types/wiki"
import type { EntityDTO, KnowledgeGraphDTO, RelationDTO } from "../dto/GraphDTO"

export function mapEntityDto(dto: EntityDTO): EntityModel {
  return { id: dto.id, name: dto.name, type: dto.type }
}

export function mapRelationDto(dto: RelationDTO): RelationModel {
  return { id: dto.id, sourceId: dto.source_entity_id, targetId: dto.target_entity_id, type: dto.type }
}

export function mapKnowledgeGraphDto(dto: KnowledgeGraphDTO): KnowledgeGraphModel {
  return {
    entities: dto.entities.map(mapEntityDto),
    relations: dto.relations.map((relation) => ({
      ...mapRelationDto(relation),
      evidence: relation.evidence.map((evidence) => ({
        nodeId: evidence.node_id,
        nodeReleaseId: evidence.node_release_id,
        excerpt: evidence.excerpt,
      })),
    })),
  }
}
