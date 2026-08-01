import { beforeEach, describe, expect, it } from "vitest"
import type { PluginHost, PluginStorage } from "@/core/plugins/host/types"
import type { PluginRecordModel } from "@/services/providers/contracts/PluginRecordProvider"
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
  const host: PluginHost = {
    project: { current: () => ({ id: "local-1", name: "Local", source: "local", path: "/project" }), subscribe: () => () => {} },
    documents: { listMarkdownPaths: () => [], listSelectableSourcePaths: () => [], listIndexedSourcePaths: () => [], readText: async () => "" },
    storage: { forPlugin: () => storage },
    records: {
      list: async () => [],
      create: async () => { throw new Error("not used") },
      update: async () => { throw new Error("not used") },
      softDelete: async () => {},
      restore: async () => {},
    },
    settings: { forPlugin: () => ({ get: () => null, set: () => {}, remove: () => {} }) },
    notifications: { info: () => {}, warning: () => {}, error: () => {} },
  }
  return { storage, current, legacy, host }
}

function createRemoteStorage() {
  const records: PluginRecordModel[] = []
  const created: Array<{ pluginId: string; recordType: string; payload: Record<string, unknown>; access: PluginRecordModel["access"] }> = []
  const storage: PluginStorage = {
    exists: async () => false,
    readJson: async () => null,
    writeJson: async () => {},
    readLegacyJson: async () => null,
  }
  const host: PluginHost = {
    project: {
      current: () => ({ id: "pandawiki:connection-1:kb-1", name: "Remote", source: "pandawiki", connectionId: "connection-1", knowledgeBaseId: "kb-1", scopeKey: "connection-1:kb-1" }),
      subscribe: () => () => {},
    },
    documents: { listMarkdownPaths: () => [], listSelectableSourcePaths: () => [], listIndexedSourcePaths: () => [], readText: async () => "" },
    storage: { forPlugin: () => storage },
    records: {
      list: async () => records,
      create: async (input) => {
        created.push(input)
        const record: PluginRecordModel = {
          id: `record-${created.length}`,
          knowledgeBaseId: "kb-1",
          pluginId: input.pluginId,
          recordType: input.recordType,
          payload: input.payload,
          access: input.access,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
        }
        records.push(record)
        return record
      },
      update: async () => { throw new Error("not used") },
      softDelete: async () => {},
      restore: async () => {},
    },
    settings: { forPlugin: () => ({ get: () => null, set: () => {}, remove: () => {} }) },
    notifications: { info: () => {}, warning: () => {}, error: () => {} },
  }
  return { host, created, records }
}

describe("submission plugin persistence", () => {
  let state: ReturnType<typeof createStorage>

  beforeEach(() => {
    state = createStorage()
    configureSubmissionStorage(state.host)
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

  it("stores a remote submission through the server record port with private access by default", async () => {
    const remote = createRemoteStorage()
    configureSubmissionStorage(remote.host)

    await saveSubmissions([makeSubmission({ id: "remote-submission" })])

    expect(remote.created).toEqual([
      expect.objectContaining({
        pluginId: "official.submission-management",
        recordType: "submission",
        payload: expect.objectContaining({ id: "remote-submission" }),
        access: { visibility: "private", sharedAuthGroupIds: [], allowCollaborativeEdit: false },
      }),
    ])
    await expect(loadSubmissions()).resolves.toEqual([makeSubmission({ id: "remote-submission" })])
  })
})
