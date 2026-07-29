/** Exact JSON returned by POST /api/v1/knowledge_base/search. */
export interface KnowledgeSearchNodeDTO {
  node_id: string
  name: string
  summary: string
  emoji: string
  node_path_names: string[]
}

export interface KnowledgeSearchResponseDTO {
  node_result: KnowledgeSearchNodeDTO[]
}
