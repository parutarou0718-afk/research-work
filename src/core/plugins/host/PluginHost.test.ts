import { describe, expect, it, vi } from "vitest"
import type { PandaWikiVirtualProject } from "@/domain/projects"
import { createDefaultPluginHost, createPluginHost } from "./PluginHost"
import { useWikiStore } from "@/stores/wiki-store"

vi.mock("@tauri-apps/plugin-store", () => ({
  load: vi.fn(async () => new Map<string, unknown>()),
}))

const project = { id: "project-1", name: "Project", source: "local" as const, path: "/workspace/project" }

function createHost() {
  const files = new Map<string, string>()
  const host = createPluginHost({
    project: {
      current: () => project,
      subscribe: () => () => {},
    },
    documents: {
      listMarkdownPaths: () => ["/workspace/project/wiki/paper.md"],
      listSelectableSourcePaths: () => ["/workspace/project/raw/sources/paper.pdf"],
      listIndexedSourcePaths: () => ["/workspace/project/raw/sources/indexed.docx"],
      readText: async (path) => `content:${path}`,
    },
    files: {
      exists: async (path) => files.has(path),
      readText: async (path) => files.get(path) ?? "",
      writeText: async (path, value) => { files.set(path, value) },
      createDirectory: async () => {},
    },
    settingsStorage: new Map<string, string>(),
    notify: { info: vi.fn(), warning: vi.fn(), error: vi.fn() },
  })
  return { host, files }
}

describe("PluginHost", () => {

  it("isolates plugin storage under the current project plugin namespace", async () => {
    const { host, files } = createHost()
    const storage = host.storage.forPlugin("official.submission-management")

    await storage.writeJson("storage.json", { version: 1, items: [] })

    expect([...files.keys()]).toEqual([
      "/workspace/project/.llm-wiki/plugins/official.submission-management/storage.json",
    ])
    await expect(storage.readJson<{ version: number }>("storage.json")).resolves.toEqual({ version: 1, items: [] })
  })

  it("namespaces settings so one plugin cannot overwrite another plugin setting", () => {
    const { host } = createHost()
    host.settings.forPlugin("official.submission-management").set("view", "table")
    host.settings.forPlugin("official.meetings").set("view", "calendar")

    expect(host.settings.forPlugin("official.submission-management").get("view")).toBe("table")
    expect(host.settings.forPlugin("official.meetings").get("view")).toBe("calendar")
  })

  it("stores PandaWiki plugin records by remote scope without using filesystem paths", async () => {
    const files = new Map<string, string>()
    const remoteData = new Map<string, unknown>()
    const host = createPluginHost({
      project: {
        current: () => ({
          id: "pandawiki:server-a:kb-1",
          name: "Remote knowledge",
          source: "pandawiki" as const,
          connectionId: "server-a",
          knowledgeBaseId: "kb-1",
          scopeKey: "pandawiki:server-a:kb-1",
        }),
        subscribe: () => () => {},
      },
      documents: {
        listMarkdownPaths: () => [],
        listSelectableSourcePaths: () => [],
        listIndexedSourcePaths: () => [],
        readText: async () => { throw new Error("not available") },
      },
      files: {
        exists: async () => false,
        readText: async () => "",
        writeText: async (path, value) => { files.set(path, value) },
        createDirectory: async () => {},
      },
      settingsStorage: new Map<string, string>(),
      notify: { info: vi.fn(), warning: vi.fn(), error: vi.fn() },
      remoteData: {
        get: async (key) => remoteData.get(key),
        set: async (key, value) => { remoteData.set(key, value) },
      },
    })

    await host.storage.forPlugin("official.submission-management").writeJson("storage.json", { version: 1 })

    expect(files.size).toBe(0)
    await expect(host.storage.forPlugin("official.submission-management").readJson("storage.json"))
      .resolves.toEqual({ version: 1 })
  })

  it("returns a stable PandaWiki project snapshot to React subscribers", () => {
    const remoteProject: PandaWikiVirtualProject = {
      id: "pandawiki:server-a:kb-1",
      name: "Remote knowledge",
      source: "pandawiki" as const,
      connectionId: "server-a",
      knowledgeBaseId: "kb-1",
      scopeKey: "pandawiki:server-a:kb-1",
      capabilities: {
        readKnowledge: true,
        search: false,
        chat: false,
        editNode: false,
        upload: false,
        conversationHistory: false,
        graph: false,
        filesystem: false,
      },
    }
    useWikiStore.getState().setActiveProject(remoteProject)
    const settings = new Map<string, string>()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => settings.get(key) ?? null,
      setItem: (key: string, value: string) => settings.set(key, value),
      removeItem: (key: string) => settings.delete(key),
    })

    try {
      const host = createDefaultPluginHost()
      expect(host.project.current()).toBe(host.project.current())
    } finally {
      useWikiStore.getState().setActiveProject(null)
      vi.unstubAllGlobals()
    }
  })

  it("exposes only document data through the host adapter", async () => {
    const { host } = createHost()
    expect(host.project.current()).toEqual(project)
    expect(host.documents.listMarkdownPaths()).toEqual(["/workspace/project/wiki/paper.md"])
    await expect(host.documents.readText("/workspace/project/wiki/paper.md"))
      .resolves.toBe("content:/workspace/project/wiki/paper.md")
  })
})
