import { submissionManagementPlugin } from "@/plugins/submission-management"
import type { LlmWikiPlugin } from "./types"

export const builtinPlugins: LlmWikiPlugin[] = [submissionManagementPlugin]
