import type { ProviderCapabilities } from "../contracts/ProviderCapabilities"

export const localCapabilities: ProviderCapabilities = {
  auth: false,
  documents: false,
  conversations: true,
  search: true,
  graph: false,
  templates: false,
  providerName: "Local",
  providerVersion: "1.0",
  providerType: "local",
  supportsStreaming: true,
  supportsOffline: true,
}
