import type { PluginManifest } from "@/core/plugins/types"

export const submissionManagementManifest: PluginManifest = {
  id: "official.submission-management",
  name: "投稿管理",
  description: "管理论文投稿、审稿轮次、截止日期与稿件编号。停用插件不会删除项目中的记录。",
  version: "0.1.0",
  apiVersion: "0.1",
  kind: "official",
  defaultEnabled: false,
}
