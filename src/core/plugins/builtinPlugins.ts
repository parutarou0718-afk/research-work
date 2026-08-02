import { createSubmissionManagementPlugin } from "@/plugins/submission-management"
import {
  createInvestmentWorkspacePlugin,
  createBusinessWorkspacePlugin,
  createLegalWorkspacePlugin,
  createResearchWorkspacePlugin,
} from "@/plugins/industry-workspaces"
import type { BuiltinPluginDefinition } from "./types"

export const builtinPlugins: BuiltinPluginDefinition[] = [
  createResearchWorkspacePlugin,
  createLegalWorkspacePlugin,
  createInvestmentWorkspacePlugin,
  createBusinessWorkspacePlugin,
  createSubmissionManagementPlugin,
]
