import { createContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { PluginRegistry } from "./PluginRegistry"
import { builtinPlugins } from "./builtinPlugins"
import { useWikiStore } from "@/stores/wiki-store"
import type {
  LlmWikiPlugin,
  PluginDataRecoveryDecision,
  PluginDataRecoveryState,
  PluginId,
  PluginNavigationItem,
} from "./types"

export interface PluginContextValue {
  plugins: LlmWikiPlugin[]
  enabledPlugins: LlmWikiPlugin[]
  navigationItems: PluginNavigationItem[]
  enablePlugin: (id: PluginId) => Promise<void>
  disablePlugin: (id: PluginId) => Promise<void>
  isPluginDataRecoveryPending: (id: PluginId) => boolean
  getPluginDataRecoveryState: (id: PluginId) => PluginDataRecoveryState
  resolvePluginDataRecovery: (id: PluginId, decision: PluginDataRecoveryDecision) => Promise<void>
  isPluginEnabled: (id: PluginId) => boolean
  getPluginByRoute: (route: string) => LlmWikiPlugin | undefined
}

export const PluginContext = createContext<PluginContextValue | null>(null)

export function PluginProvider({ children }: { children: ReactNode }) {
  const projectPath = useWikiStore((state) => state.project?.path ?? null)
  const [registry] = useState(() => {
    const next = new PluginRegistry()
    builtinPlugins.forEach((plugin) => next.register(plugin))
    return next
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    void registry.activateEnabledPlugins()
  }, [registry])

  useEffect(() => {
    void registry.refreshEnabledPluginDataRecovery().then(() => {
      setVersion((current) => current + 1)
    })
  }, [projectPath, registry])

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
    isPluginDataRecoveryPending: (id) => registry.isPluginDataRecoveryPending(id),
    getPluginDataRecoveryState: (id) => registry.getPluginDataRecoveryState(id),
    resolvePluginDataRecovery: async (id, decision) => {
      await registry.resolvePluginDataRecovery(id, decision)
      setVersion((current) => current + 1)
    },
    isPluginEnabled: (id) => registry.isPluginEnabled(id),
    getPluginByRoute: (route) => registry.getEnabledPlugins().find((plugin) =>
      (plugin.navigationItems ?? []).some((item) => item.route === route),
    ),
  }), [registry, version])

  return <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
}
