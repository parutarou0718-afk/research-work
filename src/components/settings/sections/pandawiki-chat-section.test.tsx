import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PandaWikiChatSection } from "./pandawiki-chat-section"

describe("PandaWikiChatSection", () => {
  it("shows a safe configuration loading state before credentials are queried", () => {
    const markup = renderToStaticMarkup(<PandaWikiChatSection />)

    expect(markup).toContain("Loading PandaWiki chat settings")
    expect(markup).not.toContain("Chat API token")
  })
})
