import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { PluginHost } from "@/core/plugins/host/types"
import { SubmissionManagementPage } from "./SubmissionManagementPage"

vi.mock("@/core/plugins/usePlugins", () => ({
  usePlugins: () => ({
    getPluginDataRecoveryState: () => "ready",
    resolvePluginDataRecovery: vi.fn(),
  }),
}))

const host = {
  project: { current: () => null, subscribe: () => () => {} },
  documents: { listMarkdownPaths: () => [], listSelectableSourcePaths: () => [], listIndexedSourcePaths: () => [], readText: async () => "" },
} as unknown as PluginHost

describe("SubmissionManagementPage", () => {
  it("shows a scoped return action to the research workspace", () => {
    const markup = renderToStaticMarkup(<SubmissionManagementPage host={host} />)
    expect(markup).toContain("返回科研工作台")
  })
})
