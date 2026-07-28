import type { ComponentType } from "react"

export type PluginId = string

export interface PluginManifest {
  id: PluginId
  name: string
  description: string
  version: string
  apiVersion: "0.1"
  kind: "official"
  defaultEnabled: boolean
}

export interface PluginNavigationItem {
  id: string
  label: string
  route: string
  icon?: ComponentType<{ className?: string }>
  order?: number
}

export interface PluginCommand {
  id: string
  label: string
  execute: () => void | Promise<void>
}

export type PluginDataRecoveryDecision = "restore" | "defer"
export type PluginDataRecoveryState = "ready" | "pending" | "deferred"

/**
 * Optional capability for plugins that retain project-local data while hidden.
 * Core only coordinates the decision; each plugin owns its own storage.
 */
export interface PluginDataRecovery {
  hasHistoricalData: () => Promise<boolean>
  restore: () => void | Promise<void>
  defer: () => void | Promise<void>
  clearRuntimeData: () => void | Promise<void>
}

export interface LlmWikiPlugin {
  manifest: PluginManifest
  navigationItems?: PluginNavigationItem[]
  commands?: PluginCommand[]
  page?: ComponentType
  activate?: () => void | Promise<void>
  deactivate?: () => void | Promise<void>
  dataRecovery?: PluginDataRecovery
}
