import type { PluginDocumentReference } from "@/core/plugins/host/types"
import type { WorkspaceSuiteId } from "./workspace-suites"

export interface WorkspaceRecord {
  id: string
  moduleId: string
  title: string
  summary: string
  status: string
  date: string
  referenceIds: string[]
  createdAt: number
  updatedAt: number
}

export interface WorkspaceRecordData {
  version: 2
  records: WorkspaceRecord[]
}

export interface WorkspaceModuleSchema {
  title: string
  statusLabel: string
  statuses: string[]
  supportsDate: boolean
  supportsReferences: boolean
}

const DEFAULT_STATUSES = ["planned", "active", "review", "completed"]

export const WORKSPACE_MODULE_SCHEMAS: Record<WorkspaceSuiteId, Record<string, WorkspaceModuleSchema>> = {
  research: {
    projects: { title: "Research projects", statusLabel: "Stage", statuses: DEFAULT_STATUSES, supportsDate: true, supportsReferences: true },
    literature: { title: "Literature and authors", statusLabel: "Reading status", statuses: ["to-read", "reading", "noted", "cited"], supportsDate: false, supportsReferences: true },
    timeline: { title: "Research timeline", statusLabel: "Milestone", statuses: DEFAULT_STATUSES, supportsDate: true, supportsReferences: true },
    report: { title: "Literature review report", statusLabel: "Status", statuses: ["draft", "review", "final"], supportsDate: false, supportsReferences: true },
  },
  legal: {
    matters: { title: "Matters", statusLabel: "Matter status", statuses: ["open", "review", "closed"], supportsDate: true, supportsReferences: true },
    contracts: { title: "Contract review", statusLabel: "Review status", statuses: ["new", "review", "resolved"], supportsDate: true, supportsReferences: true },
    timeline: { title: "Evidence timeline", statusLabel: "Event status", statuses: ["collected", "review", "confirmed"], supportsDate: true, supportsReferences: true },
    opinion: { title: "Legal opinion report", statusLabel: "Status", statuses: ["draft", "review", "final"], supportsDate: false, supportsReferences: true },
  },
  investment: {
    companies: { title: "Companies and entities", statusLabel: "Coverage", statuses: ["watchlist", "active", "archived"], supportsDate: false, supportsReferences: true },
    diligence: { title: "Diligence items", statusLabel: "Status", statuses: DEFAULT_STATUSES, supportsDate: true, supportsReferences: true },
    risks: { title: "Risk matrix", statusLabel: "Risk level", statuses: ["low", "medium", "high", "critical"], supportsDate: true, supportsReferences: true },
    report: { title: "Investment research report", statusLabel: "Status", statuses: ["draft", "review", "final"], supportsDate: false, supportsReferences: true },
  },
  business: {
    customers: { title: "Customers and projects", statusLabel: "Relationship", statuses: ["lead", "active", "paused", "closed"], supportsDate: true, supportsReferences: true },
    followups: { title: "Sales follow-up", statusLabel: "Stage", statuses: ["lead", "qualified", "proposal", "won", "lost"], supportsDate: true, supportsReferences: true },
    knowledge: { title: "Enterprise knowledge", statusLabel: "Maturity", statuses: ["draft", "review", "approved"], supportsDate: false, supportsReferences: true },
    report: { title: "Business report", statusLabel: "Status", statuses: ["draft", "review", "final"], supportsDate: false, supportsReferences: true },
  },
}

export function emptyWorkspaceRecordData(): WorkspaceRecordData {
  return { version: 2, records: [] }
}

export function normalizeWorkspaceRecordData(value: unknown): WorkspaceRecordData {
  if (!value || typeof value !== "object") return emptyWorkspaceRecordData()
  const candidate = value as Partial<WorkspaceRecordData>
  if (!Array.isArray(candidate.records)) return emptyWorkspaceRecordData()
  return {
    version: 2,
    records: candidate.records.filter((record): record is WorkspaceRecord => Boolean(
      record && typeof record.id === "string" && typeof record.moduleId === "string" && typeof record.title === "string",
    )).map((record) => ({
      ...record,
      summary: typeof record.summary === "string" ? record.summary : "",
      status: typeof record.status === "string" ? record.status : "planned",
      date: typeof record.date === "string" ? record.date : "",
      referenceIds: Array.isArray(record.referenceIds) ? record.referenceIds.filter((id): id is string => typeof id === "string") : [],
      createdAt: typeof record.createdAt === "number" ? record.createdAt : Date.now(),
      updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : Date.now(),
    })),
  }
}

export function upsertWorkspaceRecord(data: WorkspaceRecordData, record: WorkspaceRecord): WorkspaceRecordData {
  const index = data.records.findIndex((candidate) => candidate.id === record.id)
  if (index < 0) return { ...data, records: [...data.records, record] }
  const records = [...data.records]
  records[index] = record
  return { ...data, records }
}

export function removeWorkspaceRecord(data: WorkspaceRecordData, id: string): WorkspaceRecordData {
  return { ...data, records: data.records.filter((record) => record.id !== id) }
}

export function resolveWorkspaceReferences(record: WorkspaceRecord, references: PluginDocumentReference[]): PluginDocumentReference[] {
  const selected = new Set(record.referenceIds)
  return references.filter((reference) => selected.has(reference.id))
}
