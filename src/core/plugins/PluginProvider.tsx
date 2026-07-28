import { createContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { PluginRegistry } from "./PluginRegistry"
import { builtinPlugins } from "./builtinPlugins"
import type { LlmWikiPlugin, PluginId, PluginNavigationItem } from "./types"

export interface PluginContextValue {
  plugins: LlmWikiPlugin[]
  enabledPlugins: LlmWikiPlugin[]
  navigationItems: PluginNavigationItem[]
  enablePlugin: (id: PluginId) => Promise<void>
  disablePlugin: (id: PluginId) => Promise<void>
  isPluginEnabled: (id: PluginId) => boolean
  getPluginByRoute: (route: string) => LlmWikiPlugin | undefined
}

export const PluginContext = createContext<PluginContextValue | null>(null)

export function PluginProvider({ children }: { children: ReactNode }) {
  const [registry] = useState(() => {
    const next = new PluginRegistry()
    builtinPlugins.forEach((plugin) => next.register(plugin))
    return next
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    void registry.activateEnabledPlugins()
  }, [registry])

  const value = useMemo<PluginContextValue>(() => ({
    plugins: registry.getAllPlugins(),
    enabledPlugins: registry.getEnabledPlugins(),
    navigationItems: registry.getPluginNavigationItems(),
    enablePlugin: async (id) => {
      await registry.enablePlugin(id)
      setVersion((current) => current + 1)
    },
    disablePlugin: async (id) => {
      await registry.disablePlugin(id)
      setVersion((current) => current + 1)
    },
    isPluginEnabled: (id) => registry.isPluginEnabled(id),
    getPluginByRoute: (route) => registry.getEnabledPlugins().find((plugin) =>
      (plugin.navigationItems ?? []).some((item) => item.route === route),
    ),
  }), [registry, version])

  return <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
}
