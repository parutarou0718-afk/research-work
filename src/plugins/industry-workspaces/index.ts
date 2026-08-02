import { BookOpen, BriefcaseBusiness, Scale, TrendingUp } from "lucide-react"
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
    name: "科研工作台",
    description: "研究项目、投稿管理、文献作者、研究时间线和文献综述报告。",
    label: "科研工作台",
    icon: BookOpen,
    order: 10,
  },
  legal: {
    id: "official.legal-workspace",
    navigationId: "legal-workspace",
    name: "法律工作台",
    description: "案件事项、合同审查、证据时间线、法律关系图谱和法律意见报告。",
    label: "法律工作台",
    icon: Scale,
    order: 11,
  },
  investment: {
    id: "official.investment-workspace",
    navigationId: "investment-workspace",
    name: "投研工作台",
    description: "公司主体、尽调事项、风险矩阵、关系图谱和投研报告。",
    label: "投研工作台",
    icon: TrendingUp,
    order: 12,
  },
  business: {
    id: "official.business-workspace",
    navigationId: "business-workspace",
    name: "商业工作台",
    description: "客户与项目、销售跟进、企业知识和商业报告。",
    label: "商业工作台",
    icon: BriefcaseBusiness,
    order: 13,
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
      defaultEnabled: false,
    },
    navigationItems: [
      {
        id: config.navigationId,
        label: suiteNavigationLabel(suiteId),
        route: `plugin:${config.id}`,
        icon: config.icon,
        order: config.order,
      },
    ],
    page: (props) => createElement(IndustryWorkspacesPage, { ...props, suiteId }),
  }
}

function suiteNavigationLabel(suiteId: WorkspaceSuiteId): string {
  return {
    research: "科研工作台",
    legal: "法律工作台",
    investment: "投研工作台",
    business: "商业工作台",
  }[suiteId]
}

export const createResearchWorkspacePlugin = (host: PluginHost) => createIndustryWorkspacePlugin("research", host)
export const createLegalWorkspacePlugin = (host: PluginHost) => createIndustryWorkspacePlugin("legal", host)
export const createInvestmentWorkspacePlugin = (host: PluginHost) => createIndustryWorkspacePlugin("investment", host)
export const createBusinessWorkspacePlugin = (host: PluginHost) => createIndustryWorkspacePlugin("business", host)

export function createIndustryWorkspacePlugins(host: PluginHost): LlmWikiPlugin[] {
  return [
    createResearchWorkspacePlugin(host),
    createLegalWorkspacePlugin(host),
    createInvestmentWorkspacePlugin(host),
    createBusinessWorkspacePlugin(host),
  ]
}
