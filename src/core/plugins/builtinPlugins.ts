import { createSubmissionManagementPlugin } from "@/plugins/submission-management"
import type { BuiltinPluginDefinition } from "./types"

export const builtinPlugins: BuiltinPluginDefinition[] = [createSubmissionManagementPlugin]
