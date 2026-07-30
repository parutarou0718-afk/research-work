import { createSubmissionManagementPlugin } from "@/plugins/submission-management"
import { createIndustryWorkspacesPlugin } from "@/plugins/industry-workspaces"
import type { BuiltinPluginDefinition } from "./types"

export const builtinPlugins: BuiltinPluginDefinition[] = [
  createIndustryWorkspacesPlugin,
  createSubmissionManagementPlugin,
]
