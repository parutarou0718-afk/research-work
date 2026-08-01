import type { PluginExportModel } from "./types"

function formatMetadata(model: PluginExportModel): string[] {
  return Object.entries(model.metadata).map(([key, value]) => `- **${key}:** ${value ?? ""}`)
}

export function renderPluginExportMarkdown(model: PluginExportModel): string {
  const lines = [
    `# ${model.title}`,
    "",
    `Generated: ${model.createdAt}`,
    "",
    "## Metadata",
    ...formatMetadata(model),
  ]
  for (const section of model.sections) {
    lines.push("", `## ${section.heading}`, section.body)
  }
  lines.push("", "## Structured data", "```json", JSON.stringify(model.structuredData, null, 2), "``")
  if (model.references.length > 0) {
    lines.push("", "## References")
    for (const reference of model.references) {
      const locator = reference.nodeId ? `${reference.locator} (node: ${reference.nodeId})` : reference.locator
      lines.push(`- ${reference.title} — ${locator}`)
      if (reference.excerpt) lines.push(`  - ${reference.excerpt}`)
    }
  }
  return `${lines.join("\n").trimEnd()}\n`
}

export function renderPluginExportJson(model: PluginExportModel): string {
  return `${JSON.stringify(model, null, 2)}\n`
}
