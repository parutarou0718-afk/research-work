import { describe, expect, it } from "vitest"
import { decodePandaWikiDocumentBytes, getPandaWikiDocumentName } from "./panda-wiki-documents-view"

describe("PandaWiki Documents helpers", () => {
  it("decodes a selected file without assigning it to a local project path", () => {
    expect(Array.from(decodePandaWikiDocumentBytes("AQID"))).toEqual([1, 2, 3])
  })

  it("extracts a file name from Windows and POSIX dialog paths", () => {
    expect(getPandaWikiDocumentName("C:\\Users\\alice\\paper.pdf")).toBe("paper.pdf")
    expect(getPandaWikiDocumentName("/tmp/paper.md")).toBe("paper.md")
  })
})
