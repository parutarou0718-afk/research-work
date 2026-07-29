export interface EntityDTO {
  id: string
  name: string
  type: string
  attributes?: Record<string, unknown>
}

export interface RelationDTO {
  id: string
  source_entity_id: string
  target_entity_id: string
  type: string
  evidence: GraphEvidenceDTO[]
}

export interface GraphEvidenceDTO {
  node_id: string
  node_release_id: string
  excerpt: string
}

export interface KnowledgeGraphDTO {
  schema?: KnowledgeSchemaDTO
  entities: EntityDTO[]
  relations: RelationDTO[]
}

export interface KnowledgeFieldDTO {
  key: string
  label: string
  target: "entity"
  entity_types: string[]
  value_type: "text" | "number" | "date" | "boolean" | "select"
  multiple: boolean
  filterable: boolean
  enabled: boolean
  options: string[]
  extract_instruction: string
}

export interface KnowledgeNavigationSectionDTO {
  id: string
  label: string
  entity_types: string[]
  field_keys: string[]
  order: number
  enabled: boolean
}

export interface KnowledgeSchemaDTO {
  version: number
  fields: KnowledgeFieldDTO[]
  navigation: KnowledgeNavigationSectionDTO[]
}
