import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { PandaWikiConnectCard } from "./pandawiki-connect-card"

describe("PandaWikiConnectCard", () => {
  it("offers server connection without replacing the local project actions", () => {
    const markup = renderToStaticMarkup(
      <PandaWikiConnectCard connected={false} onConnect={() => undefined} />,
    )

    expect(markup).toContain("服务器 Wiki")
    expect(markup).toContain("连接服务器")
    expect(markup).not.toContain("Server address")
  })
})
