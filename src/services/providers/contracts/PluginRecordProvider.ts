export type PluginRecordVisibility = "private" | "knowledge_base" | "groups"

export interface PluginRecordAccess {
  visibility: PluginRecordVisibility
  sharedAuthGroupIds: number[]
  allowCollaborativeEdit: boolean
}

export interface PluginRecordModel {
  id: string
  knowledgeBaseId: string
  pluginId: string
  recordType: string
  payload: unknown
  access: PluginRecordAccess
  createdAt: string
  updatedAt: string
}

export interface PluginRecordInput {
  knowledgeBaseId: string
  pluginId: string
  recordType: string
  payload: Record<string, unknown>
  access: PluginRecordAccess
}

// This is a pure TypeScript capability. The concrete provider decides whether
// records are server-backed or unavailable; UI and plugins never import DTOs.
export interface PluginRecordProvider {
  list(input: Pick<PluginRecordInput, "knowledgeBaseId" | "pluginId" | "recordType">): Promise<PluginRecordModel[]>
  create(input: PluginRecordInput): Promise<PluginRecordModel>
  update(id: string, input: PluginRecordInput): Promise<PluginRecordModel>
  softDelete(id: string, input: Pick<PluginRecordInput, "knowledgeBaseId" | "pluginId" | "recordType">): Promise<void>
  restore(id: string, input: Pick<PluginRecordInput, "knowledgeBaseId" | "pluginId" | "recordType">): Promise<void>
}
