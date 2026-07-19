export type SubmissionStatus =
  | "preparing"
  | "submitted"
  | "under_review"
  | "minor_revision"
  | "major_revision"
  | "revised"
  | "accepted"
  | "rejected"
  | "withdrawn"

export type SubmissionEventType = "created" | "status_changed" | "updated"

export interface SubmissionEvent {
  id: string
  type: SubmissionEventType
  fromStatus: SubmissionStatus | null
  toStatus: SubmissionStatus
  note: string
  timestamp: number
}

export interface Submission {
  id: string
  paperPath: string
  paperTitle: string
  journalName: string
  manuscriptId: string
  submittedAt: string | null
  status: SubmissionStatus
  currentRound: number
  responseDueAt: string | null
  revisedAt: string | null
  acceptedAt: string | null
  publishedAt: string | null
  correspondingAuthor: string
  notes: string
  events: SubmissionEvent[]
  createdAt: number
  updatedAt: number
}

export type CreateSubmissionInput = Omit<
  Submission,
  "id" | "events" | "createdAt" | "updatedAt"
>

export type UpdateSubmissionInput = Partial<CreateSubmissionInput>

export const SUBMISSION_STATUSES: readonly SubmissionStatus[] = [
  "preparing",
  "submitted",
  "under_review",
  "minor_revision",
  "major_revision",
  "revised",
  "accepted",
  "rejected",
  "withdrawn",
]

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return typeof value === "string" && SUBMISSION_STATUSES.includes(value as SubmissionStatus)
}
