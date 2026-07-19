import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { realFs, createTempProject, readFileRaw, writeFileRaw, fileExists } from "@/test-helpers/fs-temp"
import type { Submission } from "@/types/submission"

const mocks = vi.hoisted(() => ({
  writeFileAtomic: vi.fn(),
}))

vi.mock("@/commands/fs", () => ({
  ...realFs,
  writeFileAtomic: mocks.writeFileAtomic,
}))

import {
  loadSubmissions,
  saveSubmissions,
  SUBMISSIONS_FILE_NAME,
} from "./submission-persist"

let tmp: { path: string; cleanup: () => Promise<void> }

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "submission-1",
    paperPath: "wiki/papers/paper-a.md",
    paperTitle: "Paper A",
    journalName: "Journal of Useful Tests",
    manuscriptId: "JUT-001",
    submittedAt: "2026-07-01",
    status: "submitted",
    currentRound: 1,
    responseDueAt: "2026-08-01",
    revisedAt: null,
    acceptedAt: null,
    publishedAt: null,
    correspondingAuthor: "Ada",
    notes: "First round",
    events: [],
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
  }
}

beforeEach(async () => {
  tmp = await createTempProject("submissions")
  mocks.writeFileAtomic.mockReset()
  mocks.writeFileAtomic.mockImplementation(realFs.writeFile)
})

afterEach(async () => {
  await tmp.cleanup()
})

describe("submission persistence", () => {
  it("returns an empty list when submissions.json does not exist", async () => {
    await expect(loadSubmissions(tmp.path)).resolves.toEqual([])
  })

  it("saves and loads submissions from .llm-wiki/submissions.json", async () => {
    const items = [
      makeSubmission({ id: "a", paperPath: "wiki/a.md", paperTitle: "A" }),
      makeSubmission({ id: "b", paperPath: "wiki/b.md", paperTitle: "B", status: "under_review" }),
    ]

    await saveSubmissions(tmp.path, items)
    await expect(loadSubmissions(tmp.path)).resolves.toEqual(items)
    expect(await fileExists(`${tmp.path}/.llm-wiki/${SUBMISSIONS_FILE_NAME}`)).toBe(true)
  })

  it("does not overwrite a corrupt submissions.json while loading", async () => {
    const path = `${tmp.path}/.llm-wiki/${SUBMISSIONS_FILE_NAME}`
    await writeFileRaw(path, "{not valid json")

    await expect(loadSubmissions(tmp.path)).resolves.toEqual([])
    await expect(readFileRaw(path)).resolves.toBe("{not valid json")
  })

  it("does not overwrite an empty submissions.json while loading", async () => {
    const path = `${tmp.path}/.llm-wiki/${SUBMISSIONS_FILE_NAME}`
    await writeFileRaw(path, "")

    await expect(loadSubmissions(tmp.path)).resolves.toEqual([])
    await expect(readFileRaw(path)).resolves.toBe("")
  })

  it("uses the submissions file path and preserves project-relative paper paths", async () => {
    const item = makeSubmission({
      paperPath: "wiki/papers/project-relative.md",
    })

    await saveSubmissions(tmp.path, [item])

    const raw = await readFileRaw(`${tmp.path}/.llm-wiki/${SUBMISSIONS_FILE_NAME}`)
    expect(raw).toContain('"version": 1')
    expect(raw).toContain('"paperPath": "wiki/papers/project-relative.md"')
    expect(raw).not.toContain(`${tmp.path}/wiki/papers/project-relative.md`)
    expect(mocks.writeFileAtomic).toHaveBeenCalledWith(
      `${tmp.path}/.llm-wiki/${SUBMISSIONS_FILE_NAME}`,
      expect.any(String),
    )
  })
})
