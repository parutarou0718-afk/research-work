import { describe, expect, it } from "vitest"
import { buildSubmissionExport } from "./submission-export"
import type { Submission } from "../domain/submission"

const submission: Submission = {
  id: "submission-1", paperPath: "node-42", paperTitle: "A Remote Paper", journalName: "Journal", manuscriptId: "J-1",
  submittedAt: "2026-07-01", status: "under_review", currentRound: 1, responseDueAt: null, revisedAt: null,
  acceptedAt: null, publishedAt: null, correspondingAuthor: "Author", notes: "Important notes", events: [], createdAt: 1, updatedAt: 2,
}

describe("submission export", () => {
  it("contains a locator, but never copies a remote document body", () => {
    const output = buildSubmissionExport(submission)
    expect(output.references[0]?.locator).toBe("node-42")
    expect(JSON.stringify(output)).not.toContain("documentBody")
  })
})
