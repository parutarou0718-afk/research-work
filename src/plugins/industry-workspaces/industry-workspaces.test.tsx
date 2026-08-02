import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { PluginHost } from "@/core/plugins/host/types"
import { createIndustryWorkspacePlugins } from "./index"
import { IndustryWorkspacesPage } from "./IndustryWorkspacesPage"
import i18n from "@/i18n"

const host = {
  project: { current: () => null, subscribe: () => () => {} },
} as unknown as PluginHost

describe("Industry Workspaces plugins", () => {
  it("registers four independently-addressable workspaces that stay hidden until enabled", () => {
    const plugins = createIndustryWorkspacePlugins(host)

    expect(plugins.map((plugin) => plugin.manifest.id)).toEqual([
      "official.research-workspace",
      "official.legal-workspace",
      "official.investment-workspace",
      "official.business-workspace",
    ])
    expect(plugins.flatMap((plugin) => plugin.navigationItems ?? []).map((item) => item.id)).toEqual([
      "research-workspace",
      "legal-workspace",
      "investment-workspace",
      "business-workspace",
    ])
    expect(plugins.every((plugin) => plugin.manifest.defaultEnabled === false)).toBe(true)
  })

  it("renders the research workspace with its integrated submission entry", () => {
    const plugins = createIndustryWorkspacePlugins(host)
    const markup = renderToStaticMarkup(<IndustryWorkspacesPage host={host} suiteId="research" />)

    expect(markup).toContain("Research Workspace")
    expect(markup).toContain("Submission management")
    expect(plugins).toHaveLength(4)
  })

  it("renders the workspace shell in Chinese when the UI language is Chinese", async () => {
    await i18n.changeLanguage("zh")
    const markup = renderToStaticMarkup(<IndustryWorkspacesPage host={host} suiteId="research" />)

    expect(markup).toContain("工作台")
    expect(markup).toContain("科研工作台")
    expect(markup).not.toContain("Research Workspace")

    await i18n.changeLanguage("en")
  })
})
