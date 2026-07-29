function assertPluginId(pluginId: string): void {
  if (!/^[a-z0-9][a-z0-9.-]*$/i.test(pluginId)) {
    throw new Error(`Invalid plugin id for storage: ${pluginId}`)
  }
}

function assertFileName(fileName: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.json$/.test(fileName)) {
    throw new Error(`Invalid plugin storage file: ${fileName}`)
  }
}

/**
 * Key format for application-data persistence. The scope is encoded instead
 * of becoming a path, so remote projects cannot cross into local storage.
 */
export function remotePluginStorageKey(scopeKey: string, pluginId: string, fileName: string): string {
  if (!scopeKey.trim()) throw new Error("A PandaWiki project scope is required for plugin storage.")
  assertPluginId(pluginId)
  assertFileName(fileName)
  return `pandawiki-plugin-data.v1:${encodeURIComponent(scopeKey)}:${pluginId}:${fileName}`
}

/** A dedicated app-data file; it never shares the credential configuration store. */
export function createTauriRemotePluginDataStore(): RemotePluginDataStore {
  const store = load("pandawiki-plugin-data.json", { autoSave: true, defaults: {} })
  return {
    get: async (key) => (await store).get(key),
    set: async (key, value) => { await (await store).set(key, value) },
  }
}
import { load } from "@tauri-apps/plugin-store"

export interface RemotePluginDataStore {
  get(key: string): Promise<unknown | undefined>
  set(key: string, value: unknown): Promise<void>
}
