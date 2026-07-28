import { describe, expect, it, vi } from "vitest"
import { createPluginHost } from "./PluginHost"

const project = { id: "project-1", name: "Project", path: "/workspace/project" }

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

  it("exposes only document data through the host adapter", async () => {
    const { host } = createHost()
    expect(host.project.current()).toEqual(project)
    expect(host.documents.listMarkdownPaths()).toEqual(["/workspace/project/wiki/paper.md"])
    await expect(host.documents.readText("/workspace/project/wiki/paper.md"))
      .resolves.toBe("content:/workspace/project/wiki/paper.md")
  })
})
