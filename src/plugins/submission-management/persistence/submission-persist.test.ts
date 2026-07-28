import { beforeEach, describe, expect, it } from "vitest"
import type { PluginStorage } from "@/core/plugins/host/types"
import type { Submission } from "../domain/submission"
import {
  configureSubmissionStorage,
  hasSavedSubmissions,
  loadSubmissions,
  saveSubmissions,
  SUBMISSIONS_FILE_NAME,
} from "./submission-persist"

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

function createStorage() {
  const current = new Map<string, unknown>()
  const legacy = new Map<string, unknown>()
  const storage: PluginStorage = {
    exists: async (name) => current.has(name),
    readJson: async <T,>(name: string) => current.get(name) as T | null ?? null,
    writeJson: async <T,>(name: string, value: T) => { current.set(name, value) },
    readLegacyJson: async <T,>(name: string) => legacy.get(name) as T | null ?? null,
  }
  return { storage, current, legacy }
}

describe("submission plugin persistence", () => {
  let state: ReturnType<typeof createStorage>

  beforeEach(() => {
    state = createStorage()
    configureSubmissionStorage(state.storage)
  })

  it("uses namespaced plugin storage for new submission data", async () => {
    const items = [makeSubmission()]
    await saveSubmissions(items)

    expect(state.current.get(SUBMISSIONS_FILE_NAME)).toMatchObject({ version: 1, items })
    await expect(loadSubmissions()).resolves.toEqual(items)
  })

  it("detects historical submissions without hydrating a Store", async () => {
    await saveSubmissions([makeSubmission()])
    await expect(hasSavedSubmissions()).resolves.toBe(true)
  })

  it("imports the legacy submissions envelope once without deleting it", async () => {
    const items = [makeSubmission({ id: "legacy" })]
    state.legacy.set("submissions.json", { version: 1, items })

    await expect(loadSubmissions()).resolves.toEqual(items)
    expect(state.current.get(SUBMISSIONS_FILE_NAME)).toMatchObject({ version: 1, items })
    expect(state.legacy.get("submissions.json")).toMatchObject({ version: 1, items })
  })

  it("does not write when a legacy envelope is malformed", async () => {
    state.legacy.set("submissions.json", { version: 2, items: [] })

    await expect(loadSubmissions()).resolves.toEqual([])
    expect(state.current.has(SUBMISSIONS_FILE_NAME)).toBe(false)
  })
})
