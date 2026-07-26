import type { AuthProvider } from "./AuthProvider"
import type { KnowledgeProvider } from "./KnowledgeProvider"
import type { ProviderCapabilities } from "./ProviderCapabilities"
import type { ProviderLifecycle } from "./ProviderLifecycle"

export interface ProviderBundle {
  id: string
  type: ProviderCapabilities["providerType"]
  lifecycle: ProviderLifecycle
  capabilities: ProviderCapabilities
  auth?: AuthProvider
  knowledge: KnowledgeProvider
}
