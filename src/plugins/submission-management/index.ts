import { Send } from "lucide-react"
import type { LlmWikiPlugin } from "@/core/plugins/types"
import { submissionManagementManifest } from "./manifest"
import { SubmissionPlaceholderPage } from "./SubmissionPlaceholderPage"

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
  page: SubmissionPlaceholderPage,
}
