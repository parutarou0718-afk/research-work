import { describe, expect, it } from "vitest"
import { createTauriSessionStore, type SessionBackend } from "./TauriSessionStore"

function createMemoryBackend(): SessionBackend & { values: Map<string, string> } {
  const values = new Map<string, string>()
  return {
    values,
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => { values.set(key, value) },
    delete: async (key) => { values.delete(key) },
  }
}

describe("PandaWiki session store", () => {
  it("persists only the access token through its dedicated backend", async () => {
    const backend = createMemoryBackend()
    const store = createTauriSessionStore(backend)

    await store.saveAccessToken("token-1")

    expect(await store.loadAccessToken()).toBe("token-1")
    expect([...backend.values.entries()]).toEqual([["pandawiki.accessToken", "token-1"]])
  })

  it("clears the persisted token on logout", async () => {
    const backend = createMemoryBackend()
    const store = createTauriSessionStore(backend)
    await store.saveAccessToken("token-1")

    await store.clear()

    expect(await store.loadAccessToken()).toBeNull()
  })
})
