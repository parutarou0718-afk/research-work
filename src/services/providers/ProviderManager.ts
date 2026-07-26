import type { ProviderConfig as DomainProviderConfig } from "@/types/wiki"
import type { ProviderBundle } from "./contracts/ProviderBundle"
import type { ProviderCapabilities } from "./contracts/ProviderCapabilities"

export interface ProviderConfig extends DomainProviderConfig {}

export interface ProviderManager {
  getActiveProvider(): ProviderBundle
  switchProvider(providerId: string): Promise<void>
  getCapabilities(): ProviderCapabilities
  getAvailableProviders(): ProviderConfig[]
}
