import type { PluginHost, PluginStorage } from "@/core/plugins/host/types"
import { isSubmissionStatus, type Submission } from "../domain/submission"

export const SUBMISSIONS_FILE_NAME = "storage.json"
const LEGACY_SUBMISSIONS_FILE_NAME = "submissions.json"
const SUBMISSION_PLUGIN_ID = "official.submission-management"

interface PersistedSubmissions {
  version: 1
  items: Submission[]
}

let host: PluginHost | null = null

export function configureSubmissionStorage(nextHost: PluginHost): void {
  host = nextHost
}

function getStorage(): PluginStorage {
  if (!host) throw new Error("Submission plugin storage has not been configured.")
  return host.storage.forPlugin(SUBMISSION_PLUGIN_ID)
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
  if (!isSubmissionStatus(raw.status)) return null
  const currentRound = typeof raw.currentRound === "number" && Number.isInteger(raw.currentRound)
    ? raw.currentRound
    : 1
  return {
    id: raw.id,
    paperPath: raw.paperPath.replace(/\\\\/g, "/"),
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

function normalizePersisted(value: PersistedSubmissions | null): Submission[] {
  if (!value || value.version !== 1 || !Array.isArray(value.items)) return []
  return value.items.map(normalizeSubmission).filter((item): item is Submission => item !== null)
}

export async function loadSubmissions(): Promise<Submission[]> {
  const pluginStorage = getStorage()
  const current = await pluginStorage.readJson<PersistedSubmissions>(SUBMISSIONS_FILE_NAME)
  if (current) return normalizePersisted(current)

  const legacy = await pluginStorage.readLegacyJson<PersistedSubmissions>(LEGACY_SUBMISSIONS_FILE_NAME)
  if (!legacy) return []
  const items = normalizePersisted(legacy)
  if (items.length > 0) await saveSubmissions(items)
  return items
}

export async function hasSavedSubmissions(): Promise<boolean> {
  return (await loadSubmissions()).length > 0
}

export async function saveSubmissions(items: Submission[]): Promise<void> {
  const data: PersistedSubmissions = {
    version: 1,
    items: items.map((item) => ({ ...item, paperPath: item.paperPath.replace(/\\\\/g, "/") })),
  }
  await getStorage().writeJson(SUBMISSIONS_FILE_NAME, data)
}
