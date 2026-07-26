import type { KnowledgeDTO } from "../dto/KnowledgeDTO"
import { PandaWikiClient } from "./client"

export class PandaWikiKnowledgeApi {
  constructor(private readonly client: PandaWikiClient) {}

  listKnowledgeBases(): Promise<KnowledgeDTO[]> {
    return this.client.get<KnowledgeDTO[]>("/api/v1/knowledge_base/list")
  }

  getKnowledgeBaseDetail(id: string): Promise<KnowledgeDTO> {
    return this.client.get<KnowledgeDTO>(`/api/v1/knowledge_base/detail?kb_id=${encodeURIComponent(id)}`)
  }
}
