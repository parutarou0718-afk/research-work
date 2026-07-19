import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Submission } from "@/types/submission"

const mocks = vi.hoisted(() => ({
  loadSubmissions: vi.fn(),
  saveSubmissions: vi.fn(),
}))

vi.mock("@/lib/submission-persist", () => ({
  loadSubmissions: mocks.loadSubmissions,
  saveSubmissions: mocks.saveSubmissions,
}))

import { useSubmissionStore } from "./submission-store"

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "submission-1",
    paperPath: "wiki/papers/paper-a.md",
    paperTitle: "Paper A",
    journalName: "Journal A",
    manuscriptId: "",
    submittedAt: null,
    status: "preparing",
    currentRound: 1,
    responseDueAt: null,
    revisedAt: null,
    acceptedAt: null,
    publishedAt: null,
    correspondingAuthor: "",
    notes: "",
    events: [],
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-07-19T12:00:00Z"))
  mocks.loadSubmissions.mockReset()
  mocks.saveSubmissions.mockReset()
  mocks.saveSubmissions.mockResolvedValue(undefined)
  useSubmissionStore.getState().reset()
})

describe("submission store", () => {
  it("hydrates submissions for a project", async () => {
    const existing = [makeSubmission({ id: "existing" })]
    mocks.loadSubmissions.mockResolvedValue(existing)

    await useSubmissionStore.getState().hydrate("/project")

    expect(mocks.loadSubmissions).toHaveBeenCalledWith("/project")
    expect(useSubmissionStore.getState().items).toEqual(existing)
  })

  it("creates a submission with a created event and persists it", async () => {
    const created = await useSubmissionStore.getState().create("/project", {
      paperPath: "wiki/paper.md",
      paperTitle: "Paper",
      journalName: "Journal",
      manuscriptId: "MS-1",
      submittedAt: "2026-07-01",
      status: "submitted",
      currentRound: 1,
      responseDueAt: "2026-08-01",
      revisedAt: null,
      acceptedAt: null,
      publishedAt: null,
      correspondingAuthor: "Ada",
      notes: "note",
    })

    expect(created.id).toMatch(/^submission-/)
    expect(created.events).toHaveLength(1)
    expect(created.events[0]).toMatchObject({
      type: "created",
      fromStatus: null,
      toStatus: "submitted",
      timestamp: Date.parse("2026-07-19T12:00:00Z"),
    })
    expect(useSubmissionStore.getState().items).toEqual([created])
    expect(mocks.saveSubmissions).toHaveBeenCalledWith("/project", [created])
  })

  it("updates a submission and appends status_changed when status changes", async () => {
    useSubmissionStore.setState({
      items: [makeSubmission({ id: "s1", status: "submitted", events: [] })],
    })

    const updated = await useSubmissionStore.getState().update("/project", "s1", {
      status: "under_review",
      notes: "Editor assigned reviewers",
    })

    expect(updated.status).toBe("under_review")
    expect(updated.events).toHaveLength(1)
    expect(updated.events[0]).toMatchObject({
      type: "status_changed",
      fromStatus: "submitted",
      toStatus: "under_review",
    })
    expect(mocks.saveSubmissions).toHaveBeenCalledWith("/project", [updated])
  })

  it("does not append status_changed when status is unchanged", async () => {
    useSubmissionStore.setState({
      items: [makeSubmission({ id: "s1", status: "submitted", events: [] })],
    })

    const updated = await useSubmissionStore.getState().update("/project", "s1", {
      journalName: "New Journal",
      status: "submitted",
    })

    expect(updated.journalName).toBe("New Journal")
    expect(updated.events.filter((event) => event.type === "status_changed")).toHaveLength(0)
    expect(updated.updatedAt).toBe(Date.parse("2026-07-19T12:00:00Z"))
  })

  it("deletes only the submission record and persists the remaining list", async () => {
    const keep = makeSubmission({ id: "keep" })
    const remove = makeSubmission({ id: "remove", paperPath: "wiki/remove.md" })
    useSubmissionStore.setState({ items: [keep, remove] })

    await useSubmissionStore.getState().delete("/project", "remove")

    expect(useSubmissionStore.getState().items).toEqual([keep])
    expect(mocks.saveSubmissions).toHaveBeenCalledWith("/project", [keep])
  })

  it("reset clears in-memory submissions", () => {
    useSubmissionStore.setState({ items: [makeSubmission()] })

    useSubmissionStore.getState().reset()

    expect(useSubmissionStore.getState().items).toEqual([])
  })
})
