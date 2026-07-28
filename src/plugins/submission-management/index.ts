import { Send } from "lucide-react"
import type { PluginHost } from "@/core/plugins/host/types"
import type { LlmWikiPlugin } from "@/core/plugins/types"
import { configureSubmissionStorage, hasSavedSubmissions } from "./persistence/submission-persist"
import { useSubmissionStore } from "./store/submission-store"
import { submissionManagementManifest } from "./manifest"
import { SubmissionManagementPage } from "./SubmissionManagementPage"

export function createSubmissionManagementPlugin(host: PluginHost): LlmWikiPlugin {
  configureSubmissionStorage(host.storage.forPlugin(submissionManagementManifest.id))
  return {
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
    hasHistoricalData: async () => host.project.current() ? hasSavedSubmissions() : false,
    restore: async () => {
      if (host.project.current()) await useSubmissionStore.getState().hydrate()
    },
    defer: () => useSubmissionStore.getState().reset(),
    clearRuntimeData: () => useSubmissionStore.getState().reset(),
  },
  }
}
