import type { AuthProvider } from "./AuthProvider"
import type { KnowledgeProvider } from "./KnowledgeProvider"
import type { ProviderCapabilities } from "./ProviderCapabilities"
import type { ProviderLifecycle } from "./ProviderLifecycle"
import type { SearchProvider } from "./SearchProvider"
import type { NodeEditorProvider } from "./NodeEditorProvider"
import type { DocumentProvider } from "./DocumentProvider"
import type { GraphProvider } from "./GraphProvider"

export interface ProviderBundle {
  id: string
  type: ProviderCapabilities["providerType"]
  lifecycle: ProviderLifecycle
  capabilities: ProviderCapabilities
  auth?: AuthProvider
  knowledge: KnowledgeProvider
  search?: SearchProvider
  nodeEditor?: NodeEditorProvider
  documents?: DocumentProvider
  graph?: GraphProvider
}
