import type { CreateSubmissionInput, Submission, SubmissionStatus } from "../domain/submission"
import { SUBMISSION_STATUSES } from "../domain/submission"

export type SubmissionSortKey = "submittedAt" | "responseDueAt" | "updatedAt"
export type SortDirection = "asc" | "desc"

export interface SubmissionFilters {
  status: SubmissionStatus | "all"
  journal: string
}

export interface SubmissionStats {
  total: number
  overdue: number
  byStatus: Record<SubmissionStatus, number>
}

export type SubmissionValidationIssue =
  | "paper_required"
  | "journal_required"
  | "round_invalid"
  | "submittedAt_invalid"
  | "responseDueAt_invalid"
  | "revisedAt_invalid"
  | "acceptedAt_invalid"
  | "publishedAt_invalid"
  | "submittedAt_missing_warning"

export function submissionStatusLabelKey(status: SubmissionStatus): string {
  return `submissions.status.${status}`
}

export function validationIssueLabelKey(issue: SubmissionValidationIssue): string {
  return `submissions.validation.${issue}`
}

export function isBlockingValidationIssue(issue: SubmissionValidationIssue): boolean {
  return issue !== "submittedAt_missing_warning"
}

const TERMINAL_STATUSES = new Set<SubmissionStatus>(["accepted", "rejected", "withdrawn"])
const SUBMITTED_OR_LATER = new Set<SubmissionStatus>([
  "submitted",
  "under_review",
  "minor_revision",
  "major_revision",
  "revised",
  "accepted",
  "rejected",
  "withdrawn",
])

function todayDateOnly(now: Date): string {
  return now.toISOString().slice(0, 10)
}

function validIsoDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function nullableDateIssue(field: keyof CreateSubmissionInput, input: CreateSubmissionInput): SubmissionValidationIssue | null {
  const value = input[field]
  if (value === null || value === "") return null
  if (typeof value === "string" && validIsoDateOnly(value)) return null
  return `${field}_invalid` as SubmissionValidationIssue
}

export function isSubmissionOverdue(submission: Submission, now = new Date()): boolean {
  if (!submission.responseDueAt) return false
  if (TERMINAL_STATUSES.has(submission.status)) return false
  return submission.responseDueAt < todayDateOnly(now)
}

export function buildSubmissionStats(items: Submission[], now = new Date()): SubmissionStats {
  const byStatus = Object.fromEntries(
    SUBMISSION_STATUSES.map((status) => [status, 0]),
  ) as Record<SubmissionStatus, number>
  for (const item of items) {
    byStatus[item.status] += 1
  }
  return {
    total: items.length,
    overdue: items.filter((item) => isSubmissionOverdue(item, now)).length,
    byStatus,
  }
}

export function filterSubmissions(items: Submission[], filters: SubmissionFilters): Submission[] {
  const journalNeedle = filters.journal.trim().toLowerCase()
  return items.filter((item) => {
    if (filters.status !== "all" && item.status !== filters.status) return false
    if (journalNeedle && !item.journalName.toLowerCase().includes(journalNeedle)) return false
    return true
  })
}

function sortValue(item: Submission, key: SubmissionSortKey): string | number | null {
  if (key === "updatedAt") return item.updatedAt
  return item[key] ?? null
}

export function sortSubmissions(
  items: Submission[],
  key: SubmissionSortKey,
  direction: SortDirection,
): Submission[] {
  const sign = direction === "asc" ? 1 : -1
  return [...items].sort((a, b) => {
    const av = sortValue(a, key)
    const bv = sortValue(b, key)
    if (av === null && bv === null) return a.paperTitle.localeCompare(b.paperTitle)
    if (av === null) return 1
    if (bv === null) return -1
    if (av < bv) return -1 * sign
    if (av > bv) return 1 * sign
    return a.paperTitle.localeCompare(b.paperTitle)
  })
}

export function validateSubmissionInput(input: CreateSubmissionInput): SubmissionValidationIssue[] {
  const issues: SubmissionValidationIssue[] = []
  if (!input.paperPath.trim() || !input.paperTitle.trim()) issues.push("paper_required")
  if (!input.journalName.trim()) issues.push("journal_required")
  if (!Number.isInteger(input.currentRound) || input.currentRound < 1) issues.push("round_invalid")

  for (const field of ["submittedAt", "responseDueAt", "revisedAt", "acceptedAt", "publishedAt"] as const) {
    const issue = nullableDateIssue(field, input)
    if (issue) issues.push(issue)
  }

  if (SUBMITTED_OR_LATER.has(input.status) && !input.submittedAt) {
    issues.push("submittedAt_missing_warning")
  }
  return issues
}
