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
  it("keeps four industry workspace icons disabled until their extension is enabled", async () => {
    const registry = new PluginRegistry()
    const host = createTestHost()
    builtinPlugins.forEach((createPlugin) => registry.register(createPlugin(host)))

    expect(registry.isPluginEnabled("official.submission-management")).toBe(true)
    expect(registry.getPluginNavigationItems()).not.toEqual(expect.arrayContaining([
      "research-workspace",
      "legal-workspace",
      "investment-workspace",
      "business-workspace",
    ]))
    await registry.enablePlugin("official.research-workspace")
    await registry.enablePlugin("official.legal-workspace")
    await registry.enablePlugin("official.investment-workspace")
    await registry.enablePlugin("official.business-workspace")
    expect(registry.getPluginNavigationItems().map((item) => item.id)).toEqual(expect.arrayContaining([
      "research-workspace",
      "legal-workspace",
      "investment-workspace",
      "business-workspace",
    ]))
    expect(registry.getPluginNavigationItems()).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "industry-workspaces" }),
      expect.objectContaining({ id: "submission-management" }),
    ]))
    expect(registry.getPluginByRoute("plugin:official.submission-management")?.manifest.id)
      .toBe("official.submission-management")
  })
})
