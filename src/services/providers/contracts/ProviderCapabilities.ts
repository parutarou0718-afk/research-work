import type { ProviderType } from "@/types/wiki"

export interface ProviderCapabilities {
  auth: boolean
  documents: boolean
  conversations: boolean
  search: boolean
  graph: boolean
  templates: boolean
  providerName: string
  providerVersion: string
  providerType: ProviderType
  supportsStreaming: boolean
  supportsOffline: boolean
}
