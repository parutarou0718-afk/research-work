import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"

let activeProvider: KnowledgeProvider | null = null

// The app injects this narrow, authenticated capability. Plugins never see
// PandaWiki DTOs, sessions, or credentials.
export function configurePandaWikiPluginKnowledgeProvider(provider: KnowledgeProvider | null): void {
  activeProvider = provider
}

export function getPandaWikiPluginKnowledgeProvider(): KnowledgeProvider | null {
  return activeProvider
}
