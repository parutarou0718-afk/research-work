export interface EntityDTO {
  id: string
  name: string
  type: string
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
  entities: EntityDTO[]
  relations: RelationDTO[]
}
