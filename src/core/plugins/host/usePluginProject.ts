import { useSyncExternalStore } from "react"
import type { PluginHost } from "./types"

export function usePluginProject(host: PluginHost) {
  return useSyncExternalStore(host.project.subscribe, host.project.current, host.project.current)
}
