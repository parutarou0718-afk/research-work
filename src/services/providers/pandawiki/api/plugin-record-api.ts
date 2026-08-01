import type { PluginRecordDTO, PluginRecordWriteDTO } from "../dto/PluginRecordDTO"
import { PandaWikiClient } from "./client"

export class PandaWikiPluginRecordApi {
  constructor(private readonly client: PandaWikiClient) {}

  list(kbId: string, pluginId: string, recordType: string): Promise<PluginRecordDTO[]> {
    const query = new URLSearchParams({ kb_id: kbId, plugin_id: pluginId, record_type: recordType })
    return this.client.get<PluginRecordDTO[]>(`/api/v1/knowledge_base/plugin-records?${query.toString()}`)
  }

  create(input: PluginRecordWriteDTO): Promise<PluginRecordDTO> {
    return this.client.post<PluginRecordDTO>("/api/v1/knowledge_base/plugin-records", input)
  }

  update(id: string, input: PluginRecordWriteDTO): Promise<PluginRecordDTO> {
    return this.client.put<PluginRecordDTO>(`/api/v1/knowledge_base/plugin-records/${encodeURIComponent(id)}`, input)
  }

  async softDelete(id: string, kbId: string, pluginId: string, recordType: string): Promise<void> {
    const query = new URLSearchParams({ kb_id: kbId, plugin_id: pluginId, record_type: recordType })
    await this.client.delete<void>(`/api/v1/knowledge_base/plugin-records/${encodeURIComponent(id)}?${query.toString()}`)
  }

  async restore(id: string, kbId: string, pluginId: string, recordType: string): Promise<void> {
    await this.client.post<void>(`/api/v1/knowledge_base/plugin-records/${encodeURIComponent(id)}/restore`, {
      kb_id: kbId,
      plugin_id: pluginId,
      record_type: recordType,
    })
  }
}
