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
