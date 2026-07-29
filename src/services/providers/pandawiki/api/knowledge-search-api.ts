import type { KnowledgeSearchResponseDTO } from "../dto/KnowledgeSearchDTO"
import { PandaWikiClient } from "./client"

/**
 * The server derives group IDs from the authenticated session. The request
 * intentionally accepts only the selected KB and the query text.
 */
export class PandaWikiKnowledgeSearchApi {
  constructor(private readonly client: PandaWikiClient) {}

  search(knowledgeBaseId: string, query: string): Promise<KnowledgeSearchResponseDTO> {
    return this.client.post<KnowledgeSearchResponseDTO>("/api/v1/knowledge_base/search", {
      kb_id: knowledgeBaseId,
      query,
    })
  }
}
