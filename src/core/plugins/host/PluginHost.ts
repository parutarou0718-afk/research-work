import { createDirectory, fileExists, readFile, writeFileAtomic } from "@/commands/fs"
import { normalizePath } from "@/lib/path-utils"
import { useWikiStore } from "@/stores/wiki-store"
import type { FileNode } from "@/types/wiki"
import { createTauriRemotePluginDataStore, remotePluginStorageKey, type RemotePluginDataStore } from "./RemotePluginStore"
import { getPandaWikiPluginRecordProvider } from "./PandaWikiPluginRecordBridge"
import { getPandaWikiPluginKnowledgeProvider } from "./PandaWikiPluginKnowledgeBridge"
import type { PluginRecordProvider } from "@/services/providers/contracts/PluginRecordProvider"
import type {
  PluginDocumentsApi,
  PluginHost,
  PluginNotificationApi,
  PluginProjectApi,
} from "./types"

interface PluginHostDependencies {
  project: PluginProjectApi
  documents: PluginDocumentsApi
  files: {
    exists: (path: string) => Promise<boolean>
    readText: (path: string) => Promise<string>
    writeText: (path: string, value: string) => Promise<void>
    createDirectory: (path: string) => Promise<void>
  }
  settingsStorage: Storage | Map<string, string>
  notify: PluginNotificationApi
  remoteData?: RemotePluginDataStore
  remoteRecords?: PluginRecordProvider
}

function pluginPathSegment(pluginId: string): string {
  if (!/^[a-z0-9][a-z0-9.-]*$/i.test(pluginId)) {
    throw new Error(`Invalid plugin id for storage: ${pluginId}`)
  }
  return pluginId
}

function pluginDataPath(projectPath: string, pluginId: string, fileName: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.json$/.test(fileName)) {
    throw new Error(`Invalid plugin storage file: ${fileName}`)
  }
  return `${normalizePath(projectPath)}/.llm-wiki/plugins/${pluginPathSegment(pluginId)}/${fileName}`
}

function readSetting(storage: Storage | Map<string, string>, key: string): string | null {
  return storage instanceof Map ? storage.get(key) ?? null : storage.getItem(key)
}

function writeSetting(storage: Storage | Map<string, string>, key: string, value: string): void {
  if (storage instanceof Map) storage.set(key, value)
  else storage.setItem(key, value)
}

function removeSetting(storage: Storage | Map<string, string>, key: string): void {
  if (storage instanceof Map) storage.delete(key)
  else storage.removeItem(key)
}

export function createPluginHost(deps: PluginHostDependencies): PluginHost {
  const remoteData = deps.remoteData
  const remoteRecords = deps.remoteRecords
  const requireRemoteProject = () => {
    const project = deps.project.current()
    if (!project || project.source !== "pandawiki") throw new Error("Server plugin records require an open PandaWiki knowledge base.")
    return project
  }
  const requireRecordProvider = () => remoteRecords ?? getPandaWikiPluginRecordProvider() ?? (() => { throw new Error("PandaWiki plugin record provider is unavailable.") })()
  return {
    project: deps.project,
    documents: deps.documents,
    storage: {
      forPlugin: (pluginId) => ({
        exists: async (fileName) => {
          const project = deps.project.current()
          if (!project) return false
          if (project.source === "pandawiki") {
            return (await remoteData?.get(remotePluginStorageKey(project.scopeKey, pluginId, fileName))) !== undefined
          }
          return deps.files.exists(pluginDataPath(project.path, pluginId, fileName))
        },
        readJson: async <T,>(fileName: string): Promise<T | null> => {
          const project = deps.project.current()
          if (!project) return null
          if (project.source === "pandawiki") {
            const value = await remoteData?.get(remotePluginStorageKey(project.scopeKey, pluginId, fileName))
            return value === undefined ? null : value as T
          }
          const path = pluginDataPath(project.path, pluginId, fileName)
          if (!(await deps.files.exists(path))) return null
          try {
            return JSON.parse(await deps.files.readText(path)) as T
          } catch {
            return null
          }
        },
        writeJson: async <T,>(fileName: string, value: T): Promise<void> => {
          const project = deps.project.current()
          if (!project) throw new Error("A project must be open before plugin data can be saved.")
          if (project.source === "pandawiki") {
            if (!remoteData) throw new Error("Remote plugin storage is unavailable.")
            await remoteData.set(remotePluginStorageKey(project.scopeKey, pluginId, fileName), value)
            return
          }
          const directory = `${normalizePath(project.path)}/.llm-wiki/plugins/${pluginPathSegment(pluginId)}`
          await deps.files.createDirectory(directory)
          await deps.files.writeText(pluginDataPath(project.path, pluginId, fileName), JSON.stringify(value, null, 2))
        },
        readLegacyJson: async <T,>(fileName: string): Promise<T | null> => {
          const project = deps.project.current()
          if (!project || project.source === "pandawiki" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.json$/.test(fileName)) return null
          const path = `${normalizePath(project.path)}/.llm-wiki/${fileName}`
          if (!(await deps.files.exists(path))) return null
          try {
            return JSON.parse(await deps.files.readText(path)) as T
          } catch {
            return null
          }
        },
      }),
    },
    records: {
      list: async (pluginId, recordType) => {
        const project = requireRemoteProject()
        return requireRecordProvider().list({ knowledgeBaseId: project.knowledgeBaseId, pluginId, recordType })
      },
      create: async (input) => {
        const project = requireRemoteProject()
        return requireRecordProvider().create({ ...input, knowledgeBaseId: project.knowledgeBaseId })
      },
      update: async (id, input) => {
        const project = requireRemoteProject()
        return requireRecordProvider().update(id, { ...input, knowledgeBaseId: project.knowledgeBaseId })
      },
      softDelete: async (id, pluginId, recordType) => {
        const project = requireRemoteProject()
        return requireRecordProvider().softDelete(id, { knowledgeBaseId: project.knowledgeBaseId, pluginId, recordType })
      },
      restore: async (id, pluginId, recordType) => {
        const project = requireRemoteProject()
        return requireRecordProvider().restore(id, { knowledgeBaseId: project.knowledgeBaseId, pluginId, recordType })
      },
    },
    settings: {
      forPlugin: (pluginId) => {
        const prefix = `llm-wiki.plugins.${pluginPathSegment(pluginId)}.v0.1.`
        return {
          get: (key) => readSetting(deps.settingsStorage, `${prefix}${key}`),
          set: (key, value) => writeSetting(deps.settingsStorage, `${prefix}${key}`, value),
          remove: (key) => removeSetting(deps.settingsStorage, `${prefix}${key}`),
        }
      },
    },
    notifications: deps.notify,
  }
}

function flattenPaths(nodes: FileNode[], predicate: (path: string) => boolean): string[] {
  return nodes.flatMap((node) => node.is_dir
    ? flattenPaths(node.children ?? [], predicate)
    : predicate(node.path) ? [normalizePath(node.path)] : [])
}

function createDefaultDocumentsApi(): PluginDocumentsApi {
  const isLocalProjectOpen = () => useWikiStore.getState().activeProject?.source === "local"
  return {
    listMarkdownPaths: () => isLocalProjectOpen()
      ? flattenPaths(useWikiStore.getState().fileTree, (path) => path.toLowerCase().endsWith(".md"))
      : [],
    listSelectableSourcePaths: () => isLocalProjectOpen()
      ? flattenPaths(useWikiStore.getState().fileTree, (path) => {
      const normalized = normalizePath(path).toLowerCase()
      return normalized.includes("/raw/sources/") && /\.(md|mdx|txt|pdf|doc|docx|odt|rtf|epub|pptx)$/.test(normalized)
    })
      : [],
    listIndexedSourcePaths: () => isLocalProjectOpen()
      ? [...useWikiStore.getState().projectPathIndex.byPath.values()].map((entry) => entry.path)
      : [],
    readText: async (path) => {
      if (!isLocalProjectOpen()) {
        const provider = getPandaWikiPluginKnowledgeProvider()
        if (!provider) throw new Error("Remote knowledge provider is unavailable.")
        return (await provider.getNode(path)).content
      }
      return readFile(path)
    },
    listReferences: async () => {
      if (isLocalProjectOpen()) {
        return flattenPaths(useWikiStore.getState().fileTree, (path) => path.toLowerCase().endsWith(".md"))
          .map((path) => ({ id: path, title: path.split("/").pop()?.replace(/\.md$/i, "") ?? path, locator: path }))
      }
      const provider = getPandaWikiPluginKnowledgeProvider()
      if (!provider) return []
      const flatten = (nodes: import("@/types/wiki").FileTreeNode[]): import("./types").PluginDocumentReference[] => nodes.flatMap((node) => [
        { id: node.id, title: node.name, locator: node.id },
        ...flatten(node.children),
      ])
      return flatten((await provider.getNodeTree()).roots)
    },
  }
}

export function createDefaultPluginHost(): PluginHost {
  const project: PluginProjectApi = {
    // useSyncExternalStore requires an unchanged snapshot to retain object
    // identity. Returning a projected copy here makes remote plugin views
    // re-render indefinitely even when the active project has not changed.
    current: () => useWikiStore.getState().activeProject,
    subscribe: (listener) => useWikiStore.subscribe((state, previous) => {
      if (state.activeProject?.id !== previous.activeProject?.id) listener()
    }),
  }
  return createPluginHost({
    project,
    documents: createDefaultDocumentsApi(),
    files: {
      exists: fileExists,
      readText: readFile,
      writeText: writeFileAtomic,
      createDirectory,
    },
    settingsStorage: localStorage,
    remoteData: createTauriRemotePluginDataStore(),
    notify: {
      info: (message) => console.info("[plugin]", message),
      warning: (message) => console.warn("[plugin]", message),
      error: (message) => console.error("[plugin]", message),
    },
  })
}
