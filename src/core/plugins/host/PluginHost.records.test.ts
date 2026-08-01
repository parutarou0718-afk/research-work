import { describe, expect, it, vi } from "vitest"
import { createPluginHost } from "./PluginHost"

describe("PluginHost server records", () => {
  it("sends PandaWiki plugin records through the provider record port rather than desktop storage", async () => {
    const records = {
      list: vi.fn(async () => []),
      create: vi.fn(async () => { throw new Error("not used") }),
      update: vi.fn(async () => { throw new Error("not used") }),
      softDelete: vi.fn(async () => undefined),
      restore: vi.fn(async () => undefined),
    }
    const host = createPluginHost({
      project: {
        current: () => ({
          id: "pandawiki:server-a:kb-1",
          name: "Remote knowledge",
          source: "pandawiki" as const,
          connectionId: "server-a",
          knowledgeBaseId: "kb-1",
          scopeKey: "server-a:kb-1",
        }),
        subscribe: () => () => {},
      },
      documents: { listMarkdownPaths: () => [], listSelectableSourcePaths: () => [], listIndexedSourcePaths: () => [], readText: async () => "" },
      files: { exists: async () => false, readText: async () => "", writeText: async () => {}, createDirectory: async () => {} },
      settingsStorage: new Map<string, string>(),
      notify: { info: () => {}, warning: () => {}, error: () => {} },
      remoteRecords: records,
    })

    await host.records.list("official.submission-management", "submission")

    expect(records.list).toHaveBeenCalledWith({
      knowledgeBaseId: "kb-1",
      pluginId: "official.submission-management",
      recordType: "submission",
    })
  })
})
