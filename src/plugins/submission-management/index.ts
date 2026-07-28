import { Send } from "lucide-react"
import { useWikiStore } from "@/stores/wiki-store"
import type { LlmWikiPlugin } from "@/core/plugins/types"
import { hasSavedSubmissions } from "./persistence/submission-persist"
import { useSubmissionStore } from "./store/submission-store"
import { submissionManagementManifest } from "./manifest"
import { SubmissionManagementPage } from "./SubmissionManagementPage"

function currentProjectPath(): string | null {
  return useWikiStore.getState().project?.path ?? null
}

export const submissionManagementPlugin: LlmWikiPlugin = {
  manifest: submissionManagementManifest,
  navigationItems: [
    {
      id: "submission-management",
      label: "投稿管理",
      route: "plugin:official.submission-management",
      icon: Send,
      order: 100,
    },
  ],
  page: SubmissionManagementPage,
  dataRecovery: {
    hasHistoricalData: async () => {
      const projectPath = currentProjectPath()
      return projectPath ? hasSavedSubmissions(projectPath) : false
    },
    restore: async () => {
      const projectPath = currentProjectPath()
      if (projectPath) await useSubmissionStore.getState().hydrate(projectPath)
    },
    defer: () => useSubmissionStore.getState().reset(),
    clearRuntimeData: () => useSubmissionStore.getState().reset(),
  },
}
