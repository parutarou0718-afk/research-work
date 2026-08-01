import type { PluginHost, PluginStorage } from "@/core/plugins/host/types"
import type { PluginRecordAccess, PluginRecordModel } from "@/services/providers/contracts/PluginRecordProvider"
import { isSubmissionStatus, type Submission } from "../domain/submission"

export const SUBMISSIONS_FILE_NAME = "storage.json"
const LEGACY_SUBMISSIONS_FILE_NAME = "submissions.json"

interface PersistedSubmissions {
  version: 1
  items: Submission[]
}

const SUBMISSION_PLUGIN_ID = "official.submission-management"
const SUBMISSION_RECORD_TYPE = "submission"

let host: PluginHost | null = null

export function configureSubmissionStorage(nextHost: PluginHost): void {
  host = nextHost
}

function getStorage(): PluginStorage {
  if (!host) throw new Error("Submission plugin storage has not been configured.")
  return host.storage.forPlugin(SUBMISSION_PLUGIN_ID)
}

function isRemoteProject(): boolean {
  return host?.project.current()?.source === "pandawiki"
}

function getHost(): PluginHost {
  if (!host) throw new Error("Submission plugin storage has not been configured.")
  return host
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
  if (isRemoteProject()) {
    const records = await getHost().records.list(SUBMISSION_PLUGIN_ID, SUBMISSION_RECORD_TYPE)
    const remoteItems = records.map((record) => normalizeSubmission(record.payload)).filter((item): item is Submission => item !== null)
    if (remoteItems.length > 0) return remoteItems

    // V0.1 stored remote submissions in this device's Tauri store. Migrate a
    // valid legacy envelope only when the server has no records yet; ordinary
    // reads never overwrite server state.
    const legacyDeviceEnvelope = await getStorage().readJson<PersistedSubmissions>(SUBMISSIONS_FILE_NAME)
    const legacyDeviceItems = normalizePersisted(legacyDeviceEnvelope)
    if (legacyDeviceItems.length > 0) await saveRemoteSubmissions(legacyDeviceItems)
    return legacyDeviceItems
  }
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
  if (isRemoteProject()) {
    await saveRemoteSubmissions(items)
    return
  }
  const data: PersistedSubmissions = {
    version: 1,
    items: items.map((item) => ({ ...item, paperPath: item.paperPath.replace(/\\\\/g, "/") })),
  }
  await getStorage().writeJson(SUBMISSIONS_FILE_NAME, data)
}

function defaultRemoteAccess(): PluginRecordAccess {
  return { visibility: "private", sharedAuthGroupIds: [], allowCollaborativeEdit: false }
}

function serializeSubmission(item: Submission): Record<string, unknown> {
  return JSON.parse(JSON.stringify({ ...item, paperPath: item.paperPath.replace(/\\\\/g, "/") })) as Record<string, unknown>
}

function submissionIDFromRecord(record: PluginRecordModel): string | null {
  const submission = normalizeSubmission(record.payload)
  return submission?.id ?? null
}

async function saveRemoteSubmissions(items: Submission[]): Promise<void> {
  const pluginHost = getHost()
  const records = await pluginHost.records.list(SUBMISSION_PLUGIN_ID, SUBMISSION_RECORD_TYPE)
  const recordsBySubmissionID = new Map<string, PluginRecordModel>()
  for (const record of records) {
    const submissionID = submissionIDFromRecord(record)
    if (submissionID && !recordsBySubmissionID.has(submissionID)) recordsBySubmissionID.set(submissionID, record)
  }

  const currentIDs = new Set(items.map((item) => item.id))
  for (const item of items) {
    const existing = recordsBySubmissionID.get(item.id)
    const input = {
      pluginId: SUBMISSION_PLUGIN_ID,
      recordType: SUBMISSION_RECORD_TYPE,
      payload: serializeSubmission(item),
      access: existing?.access ?? defaultRemoteAccess(),
    }
    if (existing) await pluginHost.records.update(existing.id, input)
    else await pluginHost.records.create(input)
  }

  for (const record of records) {
    const submissionID = submissionIDFromRecord(record)
    if (submissionID && !currentIDs.has(submissionID)) {
      await pluginHost.records.softDelete(record.id, SUBMISSION_PLUGIN_ID, SUBMISSION_RECORD_TYPE)
    }
  }
}
