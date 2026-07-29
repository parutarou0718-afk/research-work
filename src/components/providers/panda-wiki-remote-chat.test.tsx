import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PandaWikiRemoteChat } from "./panda-wiki-remote-chat"

describe("PandaWikiRemoteChat", () => {
  it("renders a dedicated remote-chat loading state", () => {
    const markup = renderToStaticMarkup(<PandaWikiRemoteChat />)

    expect(markup).toContain("Loading PandaWiki chat")
    expect(markup).not.toContain("New chat")
  })
})
