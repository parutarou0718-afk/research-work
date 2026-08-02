import type { PluginManifest } from "@/core/plugins/types"

export const industryWorkspacesManifest: PluginManifest = {
  id: "official.industry-workspaces",
  name: "Industry Workspaces",
  description: "Preinstalled research, legal, and investment research workspaces.",
  version: "0.1.0",
  apiVersion: "0.1",
  kind: "official",
  defaultEnabled: true,
}
