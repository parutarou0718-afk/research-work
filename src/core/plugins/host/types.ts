export interface LocalPluginProject {
  id: string
  name: string
  source: "local"
  path: string
  capabilities?: import("@/domain/projects").ProjectCapabilities
}

export interface PandaWikiPluginProject {
  id: string
  name: string
  source: "pandawiki"
  connectionId: string
  knowledgeBaseId: string
  scopeKey: string
  knowledgeBaseId?: string
  capabilities?: import("@/domain/projects").ProjectCapabilities
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
  /** Optional while third-party plugins migrate to the narrow reference API. */
  listReferences?: () => Promise<PluginDocumentReference[]>
}

export interface PluginDocumentReference {
  id: string
  title: string
  locator: string
}

export interface PluginStorage {
  exists: (fileName: string) => Promise<boolean>
  readJson: <T>(fileName: string) => Promise<T | null>
  writeJson: <T>(fileName: string, value: T) => Promise<void>
  readLegacyJson: <T>(fileName: string) => Promise<T | null>
}

export interface PluginRecordStore {
  list: (pluginId: string, recordType: string) => Promise<import("@/services/providers/contracts/PluginRecordProvider").PluginRecordModel[]>
  create: (input: Omit<import("@/services/providers/contracts/PluginRecordProvider").PluginRecordInput, "knowledgeBaseId">) => Promise<import("@/services/providers/contracts/PluginRecordProvider").PluginRecordModel>
  update: (id: string, input: Omit<import("@/services/providers/contracts/PluginRecordProvider").PluginRecordInput, "knowledgeBaseId">) => Promise<import("@/services/providers/contracts/PluginRecordProvider").PluginRecordModel>
  softDelete: (id: string, pluginId: string, recordType: string) => Promise<void>
  restore: (id: string, pluginId: string, recordType: string) => Promise<void>
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
  records: PluginRecordStore
  settings: { forPlugin: (pluginId: string) => PluginSettings }
  notifications: PluginNotificationApi
}

export interface PluginPageProps {
  host: PluginHost
  graphProvider?: import("@/services/providers/contracts/GraphProvider").GraphProvider
}
