export interface PluginExportReference {
  title: string
  nodeId?: string
  locator: string
  href?: string
  excerpt?: string
}

export interface PluginExportSection {
  heading: string
  body: string
}

export interface PluginExportModel {
  pluginId: string
  title: string
  createdAt: string
  metadata: Record<string, string | number | boolean | null>
  sections: PluginExportSection[]
  structuredData: Record<string, unknown>
  references: PluginExportReference[]
}

export type PluginExportFormat = "markdown" | "json" | "docx" | "pdf"
