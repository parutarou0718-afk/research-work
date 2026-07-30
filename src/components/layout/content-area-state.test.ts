import { describe, expect, it } from "vitest"
import { shouldKeepLocalSourcesMounted } from "./content-area-state"

describe("content area source mounting", () => {
  it("never keeps the local SourcesView mounted for a PandaWiki project", () => {
    expect(shouldKeepLocalSourcesMounted({ isRemoteProject: true, hasMountedSources: true, activeView: "graph" })).toBe(false)
  })
})
