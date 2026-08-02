import type { PluginHost } from "@/core/plugins/host/types"
import type { LlmWikiPlugin } from "@/core/plugins/types"
import { configureSubmissionStorage, hasSavedSubmissions } from "./persistence/submission-persist"
import { useSubmissionStore } from "./store/submission-store"
import { submissionManagementManifest } from "./manifest"
import { SubmissionManagementPage } from "./SubmissionManagementPage"

/**
 * Submission management is preinstalled but intentionally has no global
 * navigation item. Research Workspace exposes it as a second-level action.
 */
export function createSubmissionManagementPlugin(host: PluginHost): LlmWikiPlugin {
  configureSubmissionStorage(host)
  return {
    manifest: submissionManagementManifest,
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
