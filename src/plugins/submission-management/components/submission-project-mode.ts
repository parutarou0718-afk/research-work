import type { PluginProject } from "@/core/plugins/host/types"

export function shouldUseManualSubmissionReference(project: PluginProject | null): boolean {
  return project?.source === "pandawiki"
}
