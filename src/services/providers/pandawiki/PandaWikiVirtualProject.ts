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
  // The OpenAI-compatible, Rust-backed adapter is implemented and keeps
  // the chat API credential outside TypeScript. Other remote capabilities
  // remain unavailable until their server contracts are verified.
  chat: true,
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
