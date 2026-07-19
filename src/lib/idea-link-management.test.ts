import { describe, expect, it } from "vitest"
import {
  addRelatedLinkToMarkdown,
  markdownHasRelatedLink,
  removeRelatedLinkFromMarkdown,
} from "./idea-link-management"

describe("idea link management", () => {
  it("adds a related wikilink section when an idea has no Related block", () => {
    expect(addRelatedLinkToMarkdown(
      "---\ntype: idea\n---\n\nBody.\n",
      { target: "wiki/entities/rld.md", title: "RLD" },
    )).toBe(
      "---\ntype: idea\n---\n\nBody.\n\n## Related\n\n[[wiki/entities/rld.md|RLD]]\n",
    )
  })

  it("adds a related wikilink to an existing Related block without duplicates", () => {
    const markdown = [
      "---",
      "type: idea",
      "---",
      "",
      "Body.",
      "",
      "## Related",
      "",
      "[[wiki/entities/rld.md|RLD]]",
      "",
    ].join("\n")

    expect(addRelatedLinkToMarkdown(markdown, { target: "wiki/entities/rld.md", title: "RLD" })).toBe(markdown)
    expect(addRelatedLinkToMarkdown(markdown, { target: "wiki/concepts/event-chain.md", title: "Event Chain" })).toBe([
      "---",
      "type: idea",
      "---",
      "",
      "Body.",
      "",
      "## Related",
      "",
      "[[wiki/entities/rld.md|RLD]]",
      "[[wiki/concepts/event-chain.md|Event Chain]]",
      "",
    ].join("\n"))
  })

  it("removes a related wikilink without deleting the idea body", () => {
    expect(removeRelatedLinkFromMarkdown([
      "---",
      "type: idea",
      "---",
      "",
      "Body.",
      "",
      "## Related",
      "",
      "[[wiki/entities/rld.md|RLD]]",
      "[[wiki/concepts/event-chain.md|Event Chain]]",
      "",
    ].join("\n"), "wiki/entities/rld.md")).toBe([
      "---",
      "type: idea",
      "---",
      "",
      "Body.",
      "",
      "## Related",
      "",
      "[[wiki/concepts/event-chain.md|Event Chain]]",
      "",
    ].join("\n"))
  })

  it("detects aliases and path-equivalent related links", () => {
    const markdown = "Body\n\n## Related\n\n[[wiki/entities/rld.md|RLD]]\n"

    expect(markdownHasRelatedLink(markdown, "wiki/entities/rld.md")).toBe(true)
    expect(markdownHasRelatedLink(markdown, " wiki/entities/rld.md ")).toBe(true)
    expect(markdownHasRelatedLink(markdown, "wiki/concepts/rld.md")).toBe(false)
  })

  it("leaves markdown unchanged when removing a missing link", () => {
    const markdown = "Body\n\n## Related\n\n[[wiki/entities/rld.md|RLD]]\n"
    expect(removeRelatedLinkFromMarkdown(markdown, "wiki/concepts/missing.md")).toBe(markdown)
  })
})
