import {
  buildPandaWikiProjectId,
  buildProviderScopeKey,
  type PandaWikiVirtualProject,
  type ProjectCapabilities,
} from "@/domain/projects"
import type { KnowledgeModel } from "@/types/wiki"

export const PANDAWIKI_PROJECT_CAPABILITIES: ProjectCapabilities = {
  readKnowledge: true,
  search: false,
  chat: false,
  editNode: false,
  upload: false,
  conversationHistory: false,
  graph: false,
  filesystem: false,
}

export function mapKnowledgeBaseToVirtualProject(
  connectionId: string,
  knowledgeBase: KnowledgeModel,
): PandaWikiVirtualProject {
  return {
    id: buildPandaWikiProjectId(connectionId, knowledgeBase.id),
    source: "pandawiki",
    name: knowledgeBase.name,
    connectionId,
    knowledgeBaseId: knowledgeBase.id,
    scopeKey: buildProviderScopeKey(connectionId, knowledgeBase.id),
    capabilities: { ...PANDAWIKI_PROJECT_CAPABILITIES },
  }
}
