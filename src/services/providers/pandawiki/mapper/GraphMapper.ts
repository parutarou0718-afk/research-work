import type { EntityModel, RelationModel } from "@/types/wiki"
import type { EntityDTO, RelationDTO } from "../dto/GraphDTO"

export function mapEntityDto(dto: EntityDTO): EntityModel {
  return { id: dto.id, name: dto.name, type: dto.type }
}

export function mapRelationDto(dto: RelationDTO): RelationModel {
  return { id: dto.id, sourceId: dto.source_id, targetId: dto.target_id, type: dto.type }
}
