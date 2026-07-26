import { load } from "@tauri-apps/plugin-store"
import { createMemorySessionStore, type SessionStore } from "./SessionStore"

const ACCESS_TOKEN_KEY = "pandawiki.accessToken"
const SESSION_STORE_NAME = "pandawiki-session.json"

export interface SessionBackend {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

export function createTauriSessionStore(backend: SessionBackend): SessionStore {
  return {
    loadAccessToken: () => backend.get(ACCESS_TOKEN_KEY),
    saveAccessToken: (token) => backend.set(ACCESS_TOKEN_KEY, token),
    clear: () => backend.delete(ACCESS_TOKEN_KEY),
  }
}

async function loadTauriBackend(): Promise<SessionBackend> {
  const store = await load(SESSION_STORE_NAME, { autoSave: true, defaults: {} })
  return {
    get: async (key) => (await store.get<string>(key)) ?? null,
    set: (key, value) => store.set(key, value),
    delete: async (key) => { await store.delete(key) },
  }
}

/**
 * Browser builds deliberately keep tokens in memory. Tauri uses a dedicated
 * plugin-store file rather than the ordinary application preferences store.
 */
export function createDefaultSessionStore(): SessionStore {
  const hasTauriRuntime = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
  if (!hasTauriRuntime) return createMemorySessionStore()

  let storePromise: Promise<SessionStore> | null = null
  const resolveStore = () => {
    storePromise ??= loadTauriBackend().then(createTauriSessionStore)
    return storePromise
  }
  return {
    loadAccessToken: async () => (await resolveStore()).loadAccessToken(),
    saveAccessToken: async (token) => (await resolveStore()).saveAccessToken(token),
    clear: async () => (await resolveStore()).clear(),
  }
}
