import { BriefcaseBusiness } from "lucide-react"
import type { PluginHost } from "@/core/plugins/host/types"
import type { LlmWikiPlugin } from "@/core/plugins/types"
import { IndustryWorkspacesPage } from "./IndustryWorkspacesPage"
import { industryWorkspacesManifest } from "./manifest"

export function createIndustryWorkspacesPlugin(_host: PluginHost): LlmWikiPlugin {
  return {
    manifest: industryWorkspacesManifest,
    navigationItems: [
      {
        id: "industry-workspaces",
        label: "Workspaces",
        route: "plugin:official.industry-workspaces",
        icon: BriefcaseBusiness,
        order: 10,
      },
    ],
    page: IndustryWorkspacesPage,
  }
}
