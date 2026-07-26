import type { ProviderCapabilities } from "../contracts/ProviderCapabilities"

export const pandaWikiCapabilities: ProviderCapabilities = {
  auth: true,
  documents: true,
  conversations: true,
  search: true,
  graph: false,
  templates: true,
  providerName: "PandaWiki",
  providerVersion: "1.0",
  providerType: "pandawiki",
  supportsStreaming: true,
  supportsOffline: false,
}
