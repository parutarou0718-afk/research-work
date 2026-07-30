import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { PluginHost } from "@/core/plugins/host/types"
import { createIndustryWorkspacesPlugin } from "./index"
import { IndustryWorkspacesPage } from "./IndustryWorkspacesPage"

const host = {
  project: { current: () => null, subscribe: () => () => {} },
} as unknown as PluginHost

describe("Industry Workspaces plugin", () => {
  it("is preinstalled with one Workspaces route", () => {
    const plugin = createIndustryWorkspacesPlugin(host)

    expect(plugin.manifest.defaultEnabled).toBe(true)
    expect(plugin.navigationItems).toEqual([
      expect.objectContaining({
        label: "Workspaces",
        route: "plugin:official.industry-workspaces",
      }),
    ])
  })

  it("renders all three installed suite choices", () => {
    const markup = renderToStaticMarkup(<IndustryWorkspacesPage host={host} />)

    expect(markup).toContain("Research Workspace")
    expect(markup).toContain("Legal Workspace")
    expect(markup).toContain("Investment Research Workspace")
  })
})
