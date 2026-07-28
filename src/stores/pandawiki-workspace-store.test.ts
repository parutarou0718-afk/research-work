import { beforeEach, describe, expect, it } from "vitest"
import { usePandaWikiWorkspaceStore } from "./pandawiki-workspace-store"

describe("PandaWiki workspace scope", () => {
  beforeEach(() => usePandaWikiWorkspaceStore.getState().reset())

  it("rejects a response from the previously selected knowledge base", () => {
    const store = usePandaWikiWorkspaceStore.getState()
    store.setActiveScope("server:kb-a")
    const request = usePandaWikiWorkspaceStore.getState().beginScopeRequest()
    usePandaWikiWorkspaceStore.getState().setActiveScope("server:kb-b")

    expect(usePandaWikiWorkspaceStore.getState().isCurrentRequest(request)).toBe(false)
  })

  it("aborts the previous scope controller during project switch", () => {
    usePandaWikiWorkspaceStore.getState().setActiveScope("server:kb-a")
    const signal = usePandaWikiWorkspaceStore.getState().beginScopeRequest().signal
    usePandaWikiWorkspaceStore.getState().setActiveScope("server:kb-b")

    expect(signal.aborted).toBe(true)
  })
})
