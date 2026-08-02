import { Button } from "@/components/ui/button"
import { usePlugins } from "@/core/plugins/usePlugins"
import type { PluginPageProps } from "@/core/plugins/host/types"
import { useWikiStore } from "@/stores/wiki-store"
import { SubmissionsView } from "./components/submissions-view"

const PLUGIN_ID = "official.submission-management"
const RESEARCH_WORKSPACE_ROUTE = "plugin:official.research-workspace"

export function SubmissionManagementPage({ host }: PluginPageProps) {
  const { getPluginDataRecoveryState, resolvePluginDataRecovery } = usePlugins()
  const recoveryState = getPluginDataRecoveryState(PLUGIN_ID)
  const returnToResearchWorkspace = () => useWikiStore.getState().setActivePluginRoute(RESEARCH_WORKSPACE_ROUTE)

  if (recoveryState !== "ready") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-lg rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">{recoveryState === "pending" ? "Historical records are ready" : "Historical record recovery is deferred"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Restore existing submission records before continuing, or defer recovery for this session.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void resolvePluginDataRecovery(PLUGIN_ID, "restore")}>Restore records</Button>
            {recoveryState === "pending" && <Button variant="outline" onClick={() => void resolvePluginDataRecovery(PLUGIN_ID, "defer")}>Defer recovery</Button>}
          </div>
        </div>
      </div>
    )
  }

  return <SubmissionsView host={host} onReturnToWorkspace={returnToResearchWorkspace} />
}
