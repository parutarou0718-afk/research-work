import type { Project } from "@/domain/projects"
import type { WikiState } from "@/stores/wiki-store"

export type ProjectView = WikiState["activeView"]

export type RemoteShellView = Extract<ProjectView, "wiki" | "sources" | "search" | "chat" | "plugin" | "settings">

export function isViewAvailable(project: Project | null, view: ProjectView | "plugin"): boolean {
  if (!project || project.source === "local") return true
  if (view === "settings" || view === "plugin" || view === "wiki" || view === "skills") return true
  if (view === "sources") return project.capabilities.upload
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

/** Remote search is backed by the authenticated PandaWiki API, not local files. */
export function usesPandaWikiSearchSurface(project: Project | null): boolean {
  return project?.source === "pandawiki" && project.capabilities.search
}

/** Remote Documents is server ingestion, never the local Sources workflow. */
export function usesPandaWikiDocumentSurface(project: Project | null): boolean {
  return project?.source === "pandawiki" && project.capabilities.upload
}

/** Graph data is always fetched from PandaWiki, never built from local files. */
export function usesPandaWikiGraphSurface(project: Project | null): boolean {
  return project?.source === "pandawiki" && project.capabilities.graph
}

export function isPandaWikiChatSettingsAvailable(project: Project | null): boolean {
  return project?.source === "pandawiki"
}

/**
 * The remote workspace is intentionally smaller than a local filesystem
 * project. This list is the single policy source for its visible shell
 * actions, so an unavailable local tool cannot become reachable by accident.
 */
export function getRemoteShellViews(project: Project | null): RemoteShellView[] {
  if (project?.source !== "pandawiki") return []

  const views: RemoteShellView[] = ["wiki"]
  if (project.capabilities.upload) views.push("sources")
  if (project.capabilities.search) views.push("search")
  if (project.capabilities.chat) views.push("chat")
  views.push("plugin", "settings")
  return views
}

/** Clip-server health is a local-project concern, not remote server health. */
export function showsLocalShellTools(project: Project | null): boolean {
  return project?.source !== "pandawiki"
}
