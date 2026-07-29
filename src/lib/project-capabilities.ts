import type { Project } from "@/domain/projects"
import type { WikiState } from "@/stores/wiki-store"

export type ProjectView = WikiState["activeView"]

export function isViewAvailable(project: Project | null, view: ProjectView | "plugin"): boolean {
  if (!project || project.source === "local") return true
  if (view === "settings" || view === "plugin" || view === "wiki" || view === "skills") return true
  if (view === "search") return project.capabilities.search
  if (view === "chat") return project.capabilities.chat
  if (view === "graph") return project.capabilities.graph
  return false
}

/**
 * Remote knowledge-base chat has a dedicated, credential-safe UI. It must
 * never fall through to the local ChatPanel, whose tools and persistence
 * require a filesystem-backed project.
 */
export function usesPandaWikiChatSurface(project: Project | null): boolean {
  return project?.source === "pandawiki" && project.capabilities.chat
}

export function isPandaWikiChatSettingsAvailable(project: Project | null): boolean {
  return project?.source === "pandawiki"
}
