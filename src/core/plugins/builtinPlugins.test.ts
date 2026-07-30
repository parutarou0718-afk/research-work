import { beforeEach, describe, expect, it } from "vitest"
import { PluginRegistry } from "./PluginRegistry"
import { builtinPlugins } from "./builtinPlugins"
import { createPluginHost } from "./host/PluginHost"

function createTestHost() {
  return createPluginHost({
    project: { current: () => null, subscribe: () => () => {} },
    documents: {
      listMarkdownPaths: () => [],
      listSelectableSourcePaths: () => [],
      listIndexedSourcePaths: () => [],
      readText: async () => "",
    },
    files: {
      exists: async () => false,
      readText: async () => "",
      writeText: async () => {},
      createDirectory: async () => {},
    },
    settingsStorage: new Map<string, string>(),
    notify: { info: () => {}, warning: () => {}, error: () => {} },
  })
}

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
  it("keeps submission management preinstalled inside Workspaces without a second global icon", async () => {
    const registry = new PluginRegistry()
    const host = createTestHost()
    builtinPlugins.forEach((createPlugin) => registry.register(createPlugin(host)))

    expect(registry.isPluginEnabled("official.submission-management")).toBe(true)
    expect(registry.getPluginNavigationItems()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "industry-workspaces", route: "plugin:official.industry-workspaces" }),
    ]))
    expect(registry.getPluginNavigationItems()).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "submission-management" }),
    ]))
    expect(registry.getPluginByRoute("plugin:official.submission-management")?.manifest.id)
      .toBe("official.submission-management")
  })
})
