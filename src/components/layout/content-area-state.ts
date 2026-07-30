import type { WikiState } from "@/stores/wiki-store"

export function shouldKeepLocalSourcesMounted({
  isRemoteProject,
  hasMountedSources,
  activeView,
}: {
  isRemoteProject: boolean
  hasMountedSources: boolean
  activeView: WikiState["activeView"]
}): boolean {
  return !isRemoteProject && (hasMountedSources || activeView === "sources")
}
