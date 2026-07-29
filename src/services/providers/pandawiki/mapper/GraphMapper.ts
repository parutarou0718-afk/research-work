import type { EntityModel, KnowledgeGraphModel, KnowledgeSchemaModel, RelationModel } from "@/types/wiki"
import type { EntityDTO, KnowledgeGraphDTO, KnowledgeSchemaDTO, RelationDTO } from "../dto/GraphDTO"

export function mapEntityDto(dto: EntityDTO): EntityModel {
  return { id: dto.id, name: dto.name, type: dto.type, attributes: dto.attributes ?? {} }
}

export function mapRelationDto(dto: RelationDTO): RelationModel {
  return { id: dto.id, sourceId: dto.source_entity_id, targetId: dto.target_entity_id, type: dto.type }
}

export function mapKnowledgeGraphDto(dto: KnowledgeGraphDTO): KnowledgeGraphModel {
  return {
    schema: mapKnowledgeSchemaDto(dto.schema),
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

export function mapKnowledgeSchemaDto(dto?: KnowledgeSchemaDTO): KnowledgeSchemaModel {
  if (!dto) return { version: 1, fields: [], navigation: [] }

  return {
    version: dto.version,
    fields: dto.fields.map((field) => ({
      key: field.key,
      label: field.label,
      target: field.target,
      entityTypes: field.entity_types,
      valueType: field.value_type,
      multiple: field.multiple,
      filterable: field.filterable,
      enabled: field.enabled,
      options: field.options,
      extractInstruction: field.extract_instruction,
    })),
    navigation: dto.navigation.map((section) => ({
      id: section.id,
      label: section.label,
      entityTypes: section.entity_types,
      fieldKeys: section.field_keys,
      order: section.order,
      enabled: section.enabled,
    })),
  }
}
