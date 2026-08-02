import { BookOpen, Scale, TrendingUp } from "lucide-react"
import { createElement } from "react"
import type { PluginHost } from "@/core/plugins/host/types"
import type { LlmWikiPlugin } from "@/core/plugins/types"
import { IndustryWorkspacesPage } from "./IndustryWorkspacesPage"
import type { WorkspaceSuiteId } from "./domain/workspace-suites"

const SUITE_PLUGIN_CONFIG: Record<WorkspaceSuiteId, {
  id: string
  navigationId: string
  name: string
  description: string
  label: string
  icon: typeof BookOpen
  order: number
}> = {
  research: {
    id: "official.research-workspace",
    navigationId: "research-workspace",
    name: "Research Workspace",
    description: "Research projects, submissions, literature, timelines, and reviews.",
    label: "科研工作台",
    icon: BookOpen,
    order: 10,
  },
  legal: {
    id: "official.legal-workspace",
    navigationId: "legal-workspace",
    name: "Legal Workspace",
    description: "Matters, contract review, evidence timelines, and legal analysis.",
    label: "法律工作台",
    icon: Scale,
    order: 11,
  },
  investment: {
    id: "official.investment-workspace",
    navigationId: "investment-workspace",
    name: "Investment Research Workspace",
    description: "Companies, diligence items, risk matrices, and investment analysis.",
    label: "投研工作台",
    icon: TrendingUp,
    order: 12,
  },
}

function createIndustryWorkspacePlugin(suiteId: WorkspaceSuiteId, _host: PluginHost): LlmWikiPlugin {
  const config = SUITE_PLUGIN_CONFIG[suiteId]
  return {
    manifest: {
      id: config.id,
      name: config.name,
      description: config.description,
      version: "0.2.0",
      apiVersion: "0.1",
      kind: "official",
      defaultEnabled: true,
    },
    navigationItems: [
      {
        id: config.navigationId,
        label: config.label,
        route: `plugin:${config.id}`,
        icon: config.icon,
        order: config.order,
      },
    ],
    page: (props) => createElement(IndustryWorkspacesPage, { ...props, suiteId }),
  }
}

export const createResearchWorkspacePlugin = (host: PluginHost) => createIndustryWorkspacePlugin("research", host)
export const createLegalWorkspacePlugin = (host: PluginHost) => createIndustryWorkspacePlugin("legal", host)
export const createInvestmentWorkspacePlugin = (host: PluginHost) => createIndustryWorkspacePlugin("investment", host)

export function createIndustryWorkspacePlugins(host: PluginHost): LlmWikiPlugin[] {
  return [
    createResearchWorkspacePlugin(host),
    createLegalWorkspacePlugin(host),
    createInvestmentWorkspacePlugin(host),
  ]
}
