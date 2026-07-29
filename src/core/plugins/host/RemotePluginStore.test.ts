import { describe, expect, it } from "vitest"
import { remotePluginStorageKey } from "./RemotePluginStore"

describe("remotePluginStorageKey", () => {
  it("isolates the same plugin file between PandaWiki knowledge-base scopes", () => {
    const first = remotePluginStorageKey(
      "pandawiki:server-a:kb-1",
      "official.submission-management",
      "storage.json",
    )
    const second = remotePluginStorageKey(
      "pandawiki:server-a:kb-2",
      "official.submission-management",
      "storage.json",
    )

    expect(first).not.toBe(second)
    expect(first).toContain("official.submission-management")
    expect(first).not.toContain("/workspace/")
  })
})
