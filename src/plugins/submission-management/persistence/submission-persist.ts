import { createDirectory, readFile, writeFileAtomic } from "@/commands/fs"
import { normalizePath } from "@/lib/path-utils"
import { isSubmissionStatus, type Submission } from "../domain/submission"

export const SUBMISSIONS_FILE_NAME = "submissions.json"

interface PersistedSubmissions {
  version: 1
  items: Submission[]
}

function submissionsFilePath(projectPath: string): string {
  const pp = normalizePath(projectPath)
  return `${pp}/.llm-wiki/${SUBMISSIONS_FILE_NAME}`
}

async function ensureSubmissionsDir(projectPath: string): Promise<void> {
  const pp = normalizePath(projectPath)
  await createDirectory(`${pp}/.llm-wiki`).catch(() => {})
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function normalizeTimestamp(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function normalizeSubmission(value: unknown): Submission | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== "string" || !raw.id.trim()) return null
  if (typeof raw.paperPath !== "string" || !raw.paperPath.trim()) return null
  if (normalizePath(raw.paperPath).match(/^[A-Za-z]:\//) || normalizePath(raw.paperPath).startsWith("//")) {
    return null
  }
  if (!isSubmissionStatus(raw.status)) return null
  const currentRound = typeof raw.currentRound === "number" && Number.isInteger(raw.currentRound)
    ? raw.currentRound
    : 1

  return {
    id: raw.id,
    paperPath: normalizePath(raw.paperPath),
    paperTitle: normalizeString(raw.paperTitle),
    journalName: normalizeString(raw.journalName),
    manuscriptId: normalizeString(raw.manuscriptId),
    submittedAt: normalizeNullableString(raw.submittedAt),
    status: raw.status,
    currentRound: Math.max(1, currentRound),
    responseDueAt: normalizeNullableString(raw.responseDueAt),
    revisedAt: normalizeNullableString(raw.revisedAt),
    acceptedAt: normalizeNullableString(raw.acceptedAt),
    publishedAt: normalizeNullableString(raw.publishedAt),
    correspondingAuthor: normalizeString(raw.correspondingAuthor),
    notes: normalizeString(raw.notes),
    events: Array.isArray(raw.events) ? raw.events as Submission["events"] : [],
    createdAt: normalizeTimestamp(raw.createdAt),
    updatedAt: normalizeTimestamp(raw.updatedAt),
  }
}

export async function loadSubmissions(projectPath: string): Promise<Submission[]> {
  try {
    const content = await readFile(submissionsFilePath(projectPath))
    if (!content.trim()) return []
    const parsed = JSON.parse(content) as Partial<PersistedSubmissions>
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) return []
    return parsed.items
      .map(normalizeSubmission)
      .filter((item): item is Submission => item !== null)
  } catch {
    return []
  }
}

/** Reads only the persisted envelope; it never hydrates the plugin Store. */
export async function hasSavedSubmissions(projectPath: string): Promise<boolean> {
  return (await loadSubmissions(projectPath)).length > 0
}

export async function saveSubmissions(projectPath: string, items: Submission[]): Promise<void> {
  await ensureSubmissionsDir(projectPath)
  const data: PersistedSubmissions = {
    version: 1,
    items: items.map((item) => ({
      ...item,
      paperPath: normalizePath(item.paperPath),
    })),
  }
  await writeFileAtomic(submissionsFilePath(projectPath), JSON.stringify(data, null, 2))
}
