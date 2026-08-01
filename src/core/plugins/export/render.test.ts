import { describe, expect, it } from "vitest"
import { renderPluginExportJson, renderPluginExportMarkdown } from "./render"
import type { PluginExportModel } from "./types"

const model: PluginExportModel = {
  pluginId: "official.submission-management",
  title: "Submission: Paper A",
  createdAt: "2026-08-01T00:00:00.000Z",
  metadata: { status: "submitted" },
  sections: [{ heading: "Notes", body: "First round complete." }],
  structuredData: { manuscriptId: "JUT-001" },
  references: [{ title: "Paper A", nodeId: "node-1", locator: "wiki/papers/paper-a.md" }],
}

describe("plugin export renderers", () => {
  it("renders the model and stable reference locators to Markdown", () => {
    const output = renderPluginExportMarkdown(model)
    expect(output).toContain("# Submission: Paper A")
    expect(output).toContain("## References")
    expect(output).toContain("node-1")
    expect(output).toContain("wiki/papers/paper-a.md")
  })

  it("renders an inspectable JSON export without an implicit document body", () => {
    const output = JSON.parse(renderPluginExportJson(model)) as PluginExportModel
    expect(output.references[0]?.nodeId).toBe("node-1")
    expect(output).not.toHaveProperty("documentBody")
  })
})
