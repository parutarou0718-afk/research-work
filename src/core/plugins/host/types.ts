export interface LocalPluginProject {
  id: string
  name: string
  source: "local"
  path: string
}

export interface PandaWikiPluginProject {
  id: string
  name: string
  source: "pandawiki"
  scopeKey: string
}

export type PluginProject = LocalPluginProject | PandaWikiPluginProject

export interface PluginProjectApi {
  current: () => PluginProject | null
  subscribe: (listener: () => void) => () => void
}

export interface PluginDocumentsApi {
  listMarkdownPaths: () => string[]
  listSelectableSourcePaths: () => string[]
  listIndexedSourcePaths: () => string[]
  readText: (path: string) => Promise<string>
}

export interface PluginStorage {
  exists: (fileName: string) => Promise<boolean>
  readJson: <T>(fileName: string) => Promise<T | null>
  writeJson: <T>(fileName: string, value: T) => Promise<void>
  readLegacyJson: <T>(fileName: string) => Promise<T | null>
}

export interface PluginSettings {
  get: (key: string) => string | null
  set: (key: string, value: string) => void
  remove: (key: string) => void
}

export interface PluginNotificationApi {
  info: (message: string) => void
  warning: (message: string) => void
  error: (message: string) => void
}

export interface PluginHost {
  project: PluginProjectApi
  documents: PluginDocumentsApi
  storage: { forPlugin: (pluginId: string) => PluginStorage }
  settings: { forPlugin: (pluginId: string) => PluginSettings }
  notifications: PluginNotificationApi
}

export interface PluginPageProps {
  host: PluginHost
}
