import type { KnowledgeGraphModel } from "@/types/wiki"

/**
 * Provider-only read model. Implementations must enforce access on the
 * server; this interface deliberately has no group IDs or local-path input.
 */
export interface GraphProvider {
  getGraph(knowledgeBaseId: string): Promise<KnowledgeGraphModel>
}
