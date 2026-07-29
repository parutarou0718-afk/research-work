import { describe, expect, it } from "vitest"
import { mapParsedDocumentForImport } from "./DocumentMapper"

describe("mapParsedDocumentForImport", () => {
  it("selects a parser file document without exposing PandaWiki DTO fields", () => {
    expect(mapParsedDocumentForImport({
      id: "parse-1",
      docs: {
        children: [{
          value: {
            id: "parsed-file-1",
            title: "research-notes.pdf",
            file: true,
            file_type: "pdf",
          },
        }],
      },
    })).toEqual({
      documentId: "parsed-file-1",
      name: "research-notes.pdf",
      fileType: "pdf",
    })
  })

  it("rejects a parser response that contains no importable file document", () => {
    expect(() => mapParsedDocumentForImport({
      id: "parse-1",
      docs: { children: [{ value: { id: "folder-1", title: "Folder", file: false } }] },
    })).toThrow("PandaWiki parser response did not contain an importable file")
  })
})
