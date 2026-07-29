/**
 * A provider-neutral, server-filtered knowledge search result.
 *
 * This deliberately has no transport DTO fields and no client-side permission
 * data. Providers must enforce access control before returning results.
 */
export interface KnowledgeSearchResult {
  nodeId: string
  title: string
  summary: string
  emoji: string
  pathNames: string[]
}

/** Read-only knowledge search capability. */
export interface SearchProvider {
  search(knowledgeBaseId: string, query: string): Promise<KnowledgeSearchResult[]>
}
