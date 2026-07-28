import { beforeEach, describe, expect, it } from "vitest"
import { PluginRegistry } from "./PluginRegistry"
import { builtinPlugins } from "./builtinPlugins"

beforeEach(() => {
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
})

describe("official built-in plugins", () => {
  it("keeps submission management hidden until it is explicitly enabled", async () => {
    const registry = new PluginRegistry()
    builtinPlugins.forEach((plugin) => registry.register(plugin))

    expect(registry.isPluginEnabled("official.submission-management")).toBe(false)
    expect(registry.getPluginNavigationItems()).toEqual([])

    await registry.enablePlugin("official.submission-management")
    expect(registry.getPluginNavigationItems()).toMatchObject([
      { id: "submission-management", route: "plugin:official.submission-management" },
    ])

    await registry.disablePlugin("official.submission-management")
    expect(registry.getPluginNavigationItems()).toEqual([])
  })
})
