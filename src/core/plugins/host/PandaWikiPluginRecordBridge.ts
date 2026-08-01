import type { PluginRecordProvider } from "@/services/providers/contracts/PluginRecordProvider"

let activeProvider: PluginRecordProvider | null = null

// App owns the authenticated PandaWiki provider. Plugins obtain only this
// narrow record capability, never the provider's DTOs or credentials.
export function configurePandaWikiPluginRecordProvider(provider: PluginRecordProvider | null): void {
  activeProvider = provider
}

export function getPandaWikiPluginRecordProvider(): PluginRecordProvider | null {
  return activeProvider
}
