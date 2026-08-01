import { invoke } from "@tauri-apps/api/core"
import { renderPluginExportJson, renderPluginExportMarkdown } from "./render"
import type { PluginExportFormat, PluginExportModel } from "./types"

export interface WritePluginExportOptions {
  directory: string
  baseName: string
  formats: PluginExportFormat[]
}

export async function writePluginExport(
  model: PluginExportModel,
  options: WritePluginExportOptions,
): Promise<string[]> {
  return invoke<string[]>("write_plugin_export", {
    request: {
      directory: options.directory,
      baseName: options.baseName,
      formats: options.formats,
      markdown: renderPluginExportMarkdown(model),
      json: renderPluginExportJson(model),
      documentTitle: model.title,
    },
  })
}
