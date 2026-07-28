import type { PluginManifest } from "@/core/plugins/types"

export const submissionManagementManifest: PluginManifest = {
  id: "official.submission-management",
  name: "投稿管理",
  description: "用于管理期刊投稿、返修与稿件版本。",
  version: "0.1.0",
  apiVersion: "0.1",
  kind: "official",
  defaultEnabled: false,
}
