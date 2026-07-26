import type { NodeDTO, NodeTreeDTO, NodeTreeGroupDTO } from "../dto/NodeDTO"
import { PandaWikiClient } from "./client"

export class PandaWikiNodeApi {
  constructor(private readonly client: PandaWikiClient) {}

  async getNodeTree(kbId: string): Promise<NodeTreeDTO> {
    const groups = await this.client.get<NodeTreeGroupDTO[]>(`/api/v1/node/list/group/nav?kb_id=${encodeURIComponent(kbId)}`)
    return { kb_id: kbId, groups }
  }

  getNodeDetail(kbId: string, id: string): Promise<NodeDTO> {
    return this.client.get<NodeDTO>(`/api/v1/node/detail?kb_id=${encodeURIComponent(kbId)}&id=${encodeURIComponent(id)}`)
  }
}
