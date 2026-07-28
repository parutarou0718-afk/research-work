import { describe, expect, it } from "vitest"
import type { FileNode } from "@/types/wiki"
import type { CreateSubmissionInput, Submission } from "../domain/submission"
import {
  buildSubmissionStats,
  filterSubmissions,
  isSubmissionOverdue,
  sortSubmissions,
  validateSubmissionInput,
} from "./submission-view-model"
import {
  buildPaperOptionsFromFiles,
  type MarkdownFileCandidate,
} from "./paper-options"

function submission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "s1",
    paperPath: "wiki/papers/a.md",
    paperTitle: "Paper A",
    journalName: "Journal A",
    manuscriptId: "",
    submittedAt: "2026-07-01",
    status: "submitted",
    currentRound: 1,
    responseDueAt: "2026-07-20",
    revisedAt: null,
    acceptedAt: null,
    publishedAt: null,
    correspondingAuthor: "",
    notes: "",
    events: [],
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe("submission view model", () => {
  it("counts submissions by status and overdue state", () => {
    const stats = buildSubmissionStats([
      submission({ id: "a", status: "submitted", responseDueAt: "2026-07-01" }),
      submission({ id: "b", status: "accepted", responseDueAt: "2026-07-01" }),
      submission({ id: "c", status: "under_review", responseDueAt: "2026-08-01" }),
    ], new Date("2026-07-19T00:00:00Z"))

    expect(stats.total).toBe(3)
    expect(stats.byStatus.submitted).toBe(1)
    expect(stats.byStatus.accepted).toBe(1)
    expect(stats.byStatus.under_review).toBe(1)
    expect(stats.overdue).toBe(1)
  })

  it("filters by status and journal", () => {
    const items = [
      submission({ id: "a", status: "submitted", journalName: "ACM MM" }),
      submission({ id: "b", status: "under_review", journalName: "IEEE TPAMI" }),
      submission({ id: "c", status: "under_review", journalName: "ACM TOG" }),
    ]

    expect(filterSubmissions(items, { status: "under_review", journal: "ACM" }).map((item) => item.id))
      .toEqual(["c"])
  })

  it("sorts by submitted date and response due date", () => {
    const items = [
      submission({ id: "a", submittedAt: "2026-07-10", responseDueAt: "2026-09-01" }),
      submission({ id: "b", submittedAt: "2026-06-01", responseDueAt: "2026-08-01" }),
      submission({ id: "c", submittedAt: null, responseDueAt: null }),
    ]

    expect(sortSubmissions(items, "submittedAt", "asc").map((item) => item.id))
      .toEqual(["b", "a", "c"])
    expect(sortSubmissions(items, "responseDueAt", "desc").map((item) => item.id))
      .toEqual(["a", "b", "c"])
  })

  it("marks overdue only when due date has passed and status is not terminal", () => {
    const now = new Date("2026-07-19T00:00:00Z")

    expect(isSubmissionOverdue(submission({ responseDueAt: "2026-07-18", status: "submitted" }), now)).toBe(true)
    expect(isSubmissionOverdue(submission({ responseDueAt: "2026-07-19", status: "submitted" }), now)).toBe(false)
    expect(isSubmissionOverdue(submission({ responseDueAt: "2026-07-18", status: "accepted" }), now)).toBe(false)
    expect(isSubmissionOverdue(submission({ responseDueAt: null, status: "submitted" }), now)).toBe(false)
  })

  it("validates required paper, journal, round, and ISO date fields", () => {
    const input: CreateSubmissionInput = {
      paperPath: "",
      paperTitle: "",
      journalName: "  ",
      manuscriptId: "",
      submittedAt: "bad-date",
      status: "submitted",
      currentRound: 0,
      responseDueAt: "2026-08-01",
      revisedAt: null,
      acceptedAt: null,
      publishedAt: null,
      correspondingAuthor: "",
      notes: "",
    }

    expect(validateSubmissionInput(input)).toEqual([
      "paper_required",
      "journal_required",
      "round_invalid",
      "submittedAt_invalid",
    ])
  })

  it("warns but does not block when submitted-or-later status has no submitted date", () => {
    const input: CreateSubmissionInput = {
      paperPath: "wiki/paper.md",
      paperTitle: "Paper",
      journalName: "Journal",
      manuscriptId: "",
      submittedAt: null,
      status: "under_review",
      currentRound: 1,
      responseDueAt: null,
      revisedAt: null,
      acceptedAt: null,
      publishedAt: null,
      correspondingAuthor: "",
      notes: "",
    }

    expect(validateSubmissionInput(input)).toEqual(["submittedAt_missing_warning"])
  })
})

describe("paper options", () => {
  const tree: FileNode[] = [
    {
      name: "wiki",
      path: "/project/wiki",
      is_dir: true,
      children: [
        { name: "paper.md", path: "/project/wiki/paper.md", is_dir: false, children: [] },
        { name: "note.md", path: "/project/wiki/note.md", is_dir: false, children: [] },
      ],
    },
  ]

  it("prefers frontmatter type=paper pages and title frontmatter", async () => {
    const files: MarkdownFileCandidate[] = [
      { path: "/project/wiki/paper.md", content: "---\ntype: paper\ntitle: Formal Paper Title\n---\n# Body" },
      { path: "/project/wiki/note.md", content: "---\ntype: note\ntitle: Note Title\n---\n# Body" },
    ]

    const options = buildPaperOptionsFromFiles("/project", tree, files)

    expect(options).toEqual([
      {
        path: "wiki/paper.md",
        title: "Formal Paper Title",
        isPaperTyped: true,
      },
    ])
  })

  it("falls back to all markdown files when no type=paper pages exist", () => {
    const files: MarkdownFileCandidate[] = [
      { path: "/project/wiki/note.md", content: "---\ntype: note\n---\n# Body" },
    ]

    const options = buildPaperOptionsFromFiles("/project", tree, files)

    expect(options).toEqual([
      {
        path: "wiki/note.md",
        title: "note",
        isPaperTyped: false,
      },
    ])
  })

  it("includes imported docx sources as selectable papers", () => {
    const sourceTree: FileNode[] = [
      {
        name: "raw",
        path: "/project/raw",
        is_dir: true,
        children: [
          {
            name: "sources",
            path: "/project/raw/sources",
            is_dir: true,
            children: [
              { name: "uploaded-paper.docx", path: "/project/raw/sources/uploaded-paper.docx", is_dir: false, children: [] },
            ],
          },
        ],
      },
    ]

    const options = buildPaperOptionsFromFiles("/project", sourceTree, [])

    expect(options).toEqual([
      {
        path: "raw/sources/uploaded-paper.docx",
        title: "uploaded-paper",
        isPaperTyped: false,
      },
    ])
  })

  it("includes imported docx sources from the project path index when the display tree is shallow", () => {
    const options = buildPaperOptionsFromFiles("/project", [], [], [
      "/project/raw/sources/uploaded-from-index.docx",
    ])

    expect(options).toEqual([
      {
        path: "raw/sources/uploaded-from-index.docx",
        title: "uploaded-from-index",
        isPaperTyped: false,
      },
    ])
  })
})
