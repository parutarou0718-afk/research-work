export interface NodeDTO {
  id: string
  kb_id: string
  name: string
  content: string
  parent_id: string
  nav_id?: string
  type: string
  status: string
  summary?: string
  emoji?: string
  updated_at: string
}

export interface NodeListItemDTO {
  id: string
  name: string
  parent_id: string
  nav_id: string
  type: string
  status: string
  summary?: string
  emoji?: string
  position: number
  updated_at: string
}

export interface NodeTreeGroupDTO {
  nav_id: string
  nav_name: string
  position: number
  list: NodeListItemDTO[]
}

export interface NodeTreeDTO {
  kb_id: string
  groups: NodeTreeGroupDTO[]
}
