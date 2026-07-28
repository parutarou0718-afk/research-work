import { Button } from "@/components/ui/button"
import { usePlugins } from "@/core/plugins/usePlugins"
import type { PluginPageProps } from "@/core/plugins/host/types"
import { SubmissionsView } from "./components/submissions-view"

const PLUGIN_ID = "official.submission-management"

export function SubmissionManagementPage({ host }: PluginPageProps) {
  const { getPluginDataRecoveryState, resolvePluginDataRecovery } = usePlugins()
  const recoveryState = getPluginDataRecoveryState(PLUGIN_ID)

  if (recoveryState !== "ready") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-lg rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">
            {recoveryState === "pending" ? "发现之前的投稿记录" : "历史投稿记录尚未加载"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            旧记录仍安全保存在项目目录中。恢复并同步后才能编辑或新增投稿，避免覆盖之前的记录。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void resolvePluginDataRecovery(PLUGIN_ID, "restore")}>
              恢复并同步历史数据
            </Button>
            {recoveryState === "pending" && (
              <Button variant="outline" onClick={() => void resolvePluginDataRecovery(PLUGIN_ID, "defer")}>
                暂不加载历史数据
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <SubmissionsView host={host} />
}
