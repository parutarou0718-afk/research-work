import { beforeEach, describe, expect, it, vi } from "vitest"
import { PluginRegistry } from "./PluginRegistry"
import type { LlmWikiPlugin } from "./types"

const storageKey = "llm-wiki.enabled-plugins.v0.1"
const appliedDefaultsStorageKey = "llm-wiki.applied-default-plugins.v0.1"

function installStorage(): void {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  })
}

function plugin(id = "official.example", defaultEnabled = false): LlmWikiPlugin {
  return {
    manifest: {
      id,
      name: "Example",
      description: "Example plugin",
      version: "0.1.0",
      apiVersion: "0.1",
      kind: "official",
      defaultEnabled,
    },
  }
}

beforeEach(() => installStorage())

describe("PluginRegistry", () => {
  it("registers and retrieves an official plugin", () => {
    const registry = new PluginRegistry()
    const item = plugin()
    registry.register(item)
    expect(registry.getPlugin(item.manifest.id)).toBe(item)
  })

  it("rejects a duplicate plugin id", () => {
    const registry = new PluginRegistry()
    registry.register(plugin())
    expect(() => registry.register(plugin())).toThrow(/already registered/i)
  })

  it("keeps a default-disabled plugin out of the enabled list", () => {
    const registry = new PluginRegistry()
    registry.register(plugin())
    expect(registry.getEnabledPlugins()).toEqual([])
  })

  it("persists enabled state and restores it in a later registry", async () => {
    const item = plugin()
    const first = new PluginRegistry()
    first.register(item)
    await first.enablePlugin(item.manifest.id)
    expect(JSON.parse(localStorage.getItem(storageKey) ?? "[]")).toEqual([item.manifest.id])

    const second = new PluginRegistry()
    second.register(item)
    expect(second.isPluginEnabled(item.manifest.id)).toBe(true)
  })

  it("enables a newly introduced default plugin once without re-enabling a user-disabled plugin", async () => {
    localStorage.setItem(storageKey, JSON.stringify(["official.previous-plugin"]))
    localStorage.setItem(appliedDefaultsStorageKey, JSON.stringify(["official.previous-plugin"]))

    const first = new PluginRegistry()
    first.register(plugin("official.industry-workspaces", true))

    expect(first.isPluginEnabled("official.industry-workspaces")).toBe(true)

    await first.disablePlugin("official.industry-workspaces")
    const second = new PluginRegistry()
    second.register(plugin("official.industry-workspaces", true))

    expect(second.isPluginEnabled("official.industry-workspaces")).toBe(false)
  })

  it("runs activation and deactivation lifecycle hooks", async () => {
    const activate = vi.fn()
    const deactivate = vi.fn()
    const registry = new PluginRegistry()
    registry.register({ ...plugin(), activate, deactivate })
    await registry.enablePlugin("official.example")
    await registry.disablePlugin("official.example")
    expect(activate).toHaveBeenCalledOnce()
    expect(deactivate).toHaveBeenCalledOnce()
  })

  it("exposes navigation only while a plugin is enabled", async () => {
    const registry = new PluginRegistry()
    registry.register({
      ...plugin(),
      navigationItems: [{ id: "example", label: "Example", route: "plugin:example" }],
    })
    expect(registry.getPluginNavigationItems()).toEqual([])
    await registry.enablePlugin("official.example")
    expect(registry.getPluginNavigationItems()).toEqual([
      { id: "example", label: "Example", route: "plugin:example" },
    ])
    await registry.disablePlugin("official.example")
    expect(registry.getPluginNavigationItems()).toEqual([])
  })

  it("isolates lifecycle errors while retaining the requested state", async () => {
    const registry = new PluginRegistry()
    registry.register({ ...plugin(), activate: () => { throw new Error("boom") } })
    await expect(registry.enablePlugin("official.example")).resolves.toBeUndefined()
    expect(registry.isPluginEnabled("official.example")).toBe(true)
  })

  it("keeps historical plugin data untouched until the user explicitly restores it", async () => {
    const restore = vi.fn()
    const defer = vi.fn()
    const clearRuntimeData = vi.fn()
    const registry = new PluginRegistry()
    registry.register({
      ...plugin(),
      dataRecovery: {
        hasHistoricalData: async () => true,
        restore,
        defer,
        clearRuntimeData,
      },
    })

    await registry.enablePlugin("official.example")

    expect(registry.isPluginDataRecoveryPending("official.example")).toBe(true)
    expect(restore).not.toHaveBeenCalled()
    expect(defer).not.toHaveBeenCalled()

    await registry.resolvePluginDataRecovery("official.example", "defer")
    expect(defer).toHaveBeenCalledOnce()
    expect(registry.isPluginDataRecoveryPending("official.example")).toBe(false)
    expect(registry.getPluginDataRecoveryState("official.example")).toBe("deferred")

    await registry.disablePlugin("official.example")
    expect(clearRuntimeData).toHaveBeenCalledOnce()
  })

  it("keeps the recovery decision available when restoring historical data fails", async () => {
    const registry = new PluginRegistry()
    registry.register({
      ...plugin(),
      dataRecovery: {
        hasHistoricalData: async () => true,
        restore: async () => { throw new Error("disk unavailable") },
        defer: vi.fn(),
        clearRuntimeData: vi.fn(),
      },
    })
    await registry.enablePlugin("official.example")

    await registry.resolvePluginDataRecovery("official.example", "restore")

    expect(registry.isPluginDataRecoveryPending("official.example")).toBe(true)
  })

  it("clears plugin runtime state before checking a newly opened project for history", async () => {
    const clearRuntimeData = vi.fn()
    const registry = new PluginRegistry()
    registry.register({
      ...plugin(),
      dataRecovery: {
        hasHistoricalData: async () => true,
        restore: vi.fn(),
        defer: vi.fn(),
        clearRuntimeData,
      },
    })
    await registry.enablePlugin("official.example")
    clearRuntimeData.mockClear()

    await registry.refreshEnabledPluginDataRecovery()

    expect(clearRuntimeData).toHaveBeenCalledOnce()
    expect(registry.getPluginDataRecoveryState("official.example")).toBe("pending")
  })
})
