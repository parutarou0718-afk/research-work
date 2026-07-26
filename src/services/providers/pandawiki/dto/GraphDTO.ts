export interface EntityDTO {
  id: string
  name: string
  type: string
}

export interface RelationDTO {
  id: string
  source_id: string
  target_id: string
  type: string
}
