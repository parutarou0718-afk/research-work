import type { PluginExportFormat } from "./types"
import { load } from "@tauri-apps/plugin-store"

const STORE_NAME = "app-state.json"
const KEY = "pluginExportPreferences"

export interface PluginExportPreferences {
  defaultDirectory: string
  formats: PluginExportFormat[]
}

export const DEFAULT_PLUGIN_EXPORT_PREFERENCES: PluginExportPreferences = {
  defaultDirectory: "",
  formats: ["docx", "pdf"],
}

function normalize(value: Partial<PluginExportPreferences> | null | undefined): PluginExportPreferences {
  const allowed: PluginExportFormat[] = ["markdown", "json", "docx", "pdf"]
  const formats = Array.isArray(value?.formats)
    ? value.formats.filter((format): format is PluginExportFormat => allowed.includes(format as PluginExportFormat))
    : DEFAULT_PLUGIN_EXPORT_PREFERENCES.formats
  return {
    defaultDirectory: typeof value?.defaultDirectory === "string" ? value.defaultDirectory : "",
    formats: formats.length > 0 ? [...new Set(formats)] : DEFAULT_PLUGIN_EXPORT_PREFERENCES.formats,
  }
}

export async function loadPluginExportPreferences(): Promise<PluginExportPreferences> {
  const store = await load(STORE_NAME, { autoSave: true, defaults: {} })
  return normalize(await store.get<Partial<PluginExportPreferences>>(KEY))
}

export async function savePluginExportPreferences(value: PluginExportPreferences): Promise<void> {
  const store = await load(STORE_NAME, { autoSave: true, defaults: {} })
  await store.set(KEY, normalize(value))
}
