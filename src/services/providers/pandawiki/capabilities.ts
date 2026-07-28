import type { ProviderCapabilities } from "../contracts/ProviderCapabilities"

export const pandaWikiCapabilities: ProviderCapabilities = {
  auth: true,
  documents: false,
  conversations: false,
  search: false,
  graph: false,
  templates: false,
  providerName: "PandaWiki",
  providerVersion: "1.0",
  providerType: "pandawiki",
  supportsStreaming: true,
  supportsOffline: false,
}
