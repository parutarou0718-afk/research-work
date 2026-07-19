import { beforeEach, describe, expect, it, vi } from "vitest"

const fsMocks = vi.hoisted(() => ({
  createDirectory: vi.fn(),
  fileExists: vi.fn(),
  writeFileAtomic: vi.fn(),
}))

vi.mock("@/commands/fs", () => ({
  createDirectory: fsMocks.createDirectory,
  fileExists: fsMocks.fileExists,
  writeFileAtomic: fsMocks.writeFileAtomic,
}))

import {
  buildRelatedWikilink,
  buildIdeaMarkdown,
  ideaSlugFromTitle,
  saveIdeaMarkdown,
} from "./idea-capture"

describe("idea capture", () => {
  beforeEach(() => {
    fsMocks.createDirectory.mockReset()
    fsMocks.fileExists.mockReset()
    fsMocks.writeFileAtomic.mockReset()
    fsMocks.createDirectory.mockResolvedValue(undefined)
    fsMocks.fileExists.mockResolvedValue(false)
    fsMocks.writeFileAtomic.mockResolvedValue(undefined)
  })

  it("creates a stable readable slug from idea titles", () => {
    expect(ideaSlugFromTitle("RLD 与事件链")).toBe("rld-与事件链")
    expect(ideaSlugFromTitle("  Resultative Complement Theory!  ")).toBe("resultative-complement-theory")
    expect(ideaSlugFromTitle("???")).toBe("idea")
  })

  it("builds idea markdown with frontmatter and body without related links in v0.2A", () => {
    expect(buildIdeaMarkdown({
      title: "RLD与事件链",
      content: "今天想到一个新的解释。",
      tags: ["syntax", " event-chain ", ""],
      now: new Date("2026-07-19T10:20:30Z"),
    })).toBe([
      "---",
      "type: idea",
      "title: RLD与事件链",
      "created: 2026-07-19",
      "updated: 2026-07-19",
      "tags:",
      "  - syntax",
      "  - event-chain",
      "---",
      "",
      "今天想到一个新的解释。",
      "",
    ].join("\n"))
  })

  it("builds idea markdown with confirmed related knowledge wikilinks", () => {
    expect(buildIdeaMarkdown({
      title: "RLD and event chains",
      content: "A new idea about resultative complements.",
      tags: ["syntax"],
      related: [
        { target: "wiki/entities/rld.md", title: "RLD" },
        { target: "wiki/concepts/event-chain.md", title: "Event Chain" },
      ],
      now: new Date("2026-07-19T10:20:30Z"),
    })).toBe([
      "---",
      "type: idea",
      "title: RLD and event chains",
      "created: 2026-07-19",
      "updated: 2026-07-19",
      "tags:",
      "  - syntax",
      "---",
      "",
      "A new idea about resultative complements.",
      "",
      "## Related",
      "",
      "[[wiki/entities/rld.md|RLD]]",
      "[[wiki/concepts/event-chain.md|Event Chain]]",
      "",
    ].join("\n"))
  })

  it("sanitizes related wikilinks without dropping the confirmed target", () => {
    expect(buildRelatedWikilink({
      target: " wiki/entities/rld.md ",
      title: "RLD | unsafe\nalias",
    })).toBe("[[wiki/entities/rld.md|RLD unsafe alias]]")
  })

  it("saves a new idea under wiki/ideas using an atomic write and unique path", async () => {
    fsMocks.fileExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)

    const saved = await saveIdeaMarkdown("/project", {
      title: "RLD 与事件链",
      content: "内容",
      tags: [],
      now: new Date("2026-07-19T00:00:00Z"),
    })

    expect(fsMocks.createDirectory).toHaveBeenCalledWith("/project/wiki")
    expect(fsMocks.createDirectory).toHaveBeenCalledWith("/project/wiki/ideas")
    expect(fsMocks.fileExists).toHaveBeenNthCalledWith(1, "/project/wiki/ideas/rld-与事件链.md")
    expect(fsMocks.fileExists).toHaveBeenNthCalledWith(2, "/project/wiki/ideas/rld-与事件链-2.md")
    expect(fsMocks.writeFileAtomic).toHaveBeenCalledWith(
      "/project/wiki/ideas/rld-与事件链-2.md",
      expect.stringContaining("type: idea"),
    )
    expect(saved.path).toBe("/project/wiki/ideas/rld-与事件链-2.md")
    expect(saved.relativePath).toBe("wiki/ideas/rld-与事件链-2.md")
  })
})
