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

export interface LlmWikiPlugin {
  manifest: PluginManifest
  navigationItems?: PluginNavigationItem[]
  commands?: PluginCommand[]
  page?: ComponentType
  activate?: () => void | Promise<void>
  deactivate?: () => void | Promise<void>
}
