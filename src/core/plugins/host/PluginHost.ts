import { createDirectory, fileExists, readFile, writeFileAtomic } from "@/commands/fs"
import { normalizePath } from "@/lib/path-utils"
import { useWikiStore } from "@/stores/wiki-store"
import type { FileNode } from "@/types/wiki"
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
  return {
    project: deps.project,
    documents: deps.documents,
    storage: {
      forPlugin: (pluginId) => ({
        exists: async (fileName) => {
          const project = deps.project.current()
          return project ? deps.files.exists(pluginDataPath(project.path, pluginId, fileName)) : false
        },
        readJson: async <T,>(fileName: string): Promise<T | null> => {
          const project = deps.project.current()
          if (!project) return null
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
          const directory = `${normalizePath(project.path)}/.llm-wiki/plugins/${pluginPathSegment(pluginId)}`
          await deps.files.createDirectory(directory)
          await deps.files.writeText(pluginDataPath(project.path, pluginId, fileName), JSON.stringify(value, null, 2))
        },
        readLegacyJson: async <T,>(fileName: string): Promise<T | null> => {
          const project = deps.project.current()
          if (!project || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.json$/.test(fileName)) return null
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
  return {
    listMarkdownPaths: () => flattenPaths(useWikiStore.getState().fileTree, (path) => path.toLowerCase().endsWith(".md")),
    listSelectableSourcePaths: () => flattenPaths(useWikiStore.getState().fileTree, (path) => {
      const normalized = normalizePath(path).toLowerCase()
      return normalized.includes("/raw/sources/") && /\.(md|mdx|txt|pdf|doc|docx|odt|rtf|epub|pptx)$/.test(normalized)
    }),
    listIndexedSourcePaths: () => [...useWikiStore.getState().projectPathIndex.byPath.values()].map((entry) => entry.path),
    readText: readFile,
  }
}

export function createDefaultPluginHost(): PluginHost {
  const project: PluginProjectApi = {
    current: () => useWikiStore.getState().project,
    subscribe: (listener) => useWikiStore.subscribe((state, previous) => {
      if (state.project?.path !== previous.project?.path) listener()
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
    notify: {
      info: (message) => console.info("[plugin]", message),
      warning: (message) => console.warn("[plugin]", message),
      error: (message) => console.error("[plugin]", message),
    },
  })
}
