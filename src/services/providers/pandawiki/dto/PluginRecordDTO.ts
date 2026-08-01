export type PluginRecordVisibilityDTO = "private" | "knowledge_base" | "groups"

export interface PluginRecordAccessDTO {
  visibility: PluginRecordVisibilityDTO
  shared_auth_group_ids: number[]
  allow_collaborative_edit: boolean
}

export interface PluginRecordDTO {
  id: string
  kb_id: string
  plugin_id: string
  record_type: string
  payload: Record<string, unknown>
  access: PluginRecordAccessDTO
  created_at: string
  updated_at: string
}

export interface PluginRecordWriteDTO {
  kb_id: string
  plugin_id: string
  record_type: string
  payload: Record<string, unknown>
  access: PluginRecordAccessDTO
}
