import type { KnowledgeGraphDTO } from "../dto/GraphDTO"
import { PandaWikiClient } from "./client"

/** Authenticated graph projection; permission filtering remains server-side. */
export class PandaWikiKnowledgeGraphApi {
  constructor(private readonly client: PandaWikiClient) {}

  getGraph(knowledgeBaseId: string): Promise<KnowledgeGraphDTO> {
    return this.client.get<KnowledgeGraphDTO>(`/api/v1/knowledge_base/graph?kb_id=${encodeURIComponent(knowledgeBaseId)}`)
  }
}
