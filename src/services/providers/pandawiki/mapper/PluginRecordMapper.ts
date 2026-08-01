import type { PluginRecordModel, PluginRecordInput } from "../../contracts/PluginRecordProvider"
import type { PluginRecordDTO, PluginRecordWriteDTO } from "../dto/PluginRecordDTO"

export function mapPluginRecordDto(dto: PluginRecordDTO): PluginRecordModel {
  return {
    id: dto.id,
    knowledgeBaseId: dto.kb_id,
    pluginId: dto.plugin_id,
    recordType: dto.record_type,
    payload: dto.payload,
    access: {
      visibility: dto.access.visibility,
      sharedAuthGroupIds: dto.access.shared_auth_group_ids,
      allowCollaborativeEdit: dto.access.allow_collaborative_edit,
    },
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

export function mapPluginRecordInput(input: PluginRecordInput): PluginRecordWriteDTO {
  return {
    kb_id: input.knowledgeBaseId,
    plugin_id: input.pluginId,
    record_type: input.recordType,
    payload: input.payload,
    access: {
      visibility: input.access.visibility,
      shared_auth_group_ids: input.access.sharedAuthGroupIds,
      allow_collaborative_edit: input.access.allowCollaborativeEdit,
    },
  }
}
