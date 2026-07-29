import type { KnowledgeSearchResult } from "../../contracts/SearchProvider"
import type { KnowledgeSearchResponseDTO } from "../dto/KnowledgeSearchDTO"

/** Maps the authenticated PandaWiki response into the provider boundary. */
export function mapKnowledgeSearchDto(dto: KnowledgeSearchResponseDTO): KnowledgeSearchResult[] {
  return dto.node_result.map((result) => ({
    nodeId: result.node_id,
    title: result.name,
    summary: result.summary,
    emoji: result.emoji,
    pathNames: result.node_path_names,
  }))
}
