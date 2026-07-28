import { beforeEach, describe, expect, it, vi } from "vitest"
import { PluginRegistry } from "./PluginRegistry"
import type { LlmWikiPlugin } from "./types"

const storageKey = "llm-wiki.enabled-plugins.v0.1"

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
})
