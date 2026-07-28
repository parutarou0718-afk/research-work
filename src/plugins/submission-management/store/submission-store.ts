import { create } from "zustand"
import { loadSubmissions, saveSubmissions } from "../persistence/submission-persist"
import type {
  CreateSubmissionInput,
  Submission,
  SubmissionEvent,
  SubmissionStatus,
  UpdateSubmissionInput,
} from "../domain/submission"

interface SubmissionState {
  items: Submission[]
  loading: boolean
  error: string | null
  hydrate: () => Promise<void>
  create: (input: CreateSubmissionInput) => Promise<Submission>
  update: (id: string, patch: UpdateSubmissionInput) => Promise<Submission>
  delete: (id: string) => Promise<void>
  reset: () => void
}

function makeId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${random}`
}

function makeEvent(input: {
  type: SubmissionEvent["type"]
  fromStatus: SubmissionStatus | null
  toStatus: SubmissionStatus
  note?: string
  timestamp: number
}): SubmissionEvent {
  return {
    id: makeId("submission-event"),
    type: input.type,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    note: input.note ?? "",
    timestamp: input.timestamp,
  }
}

export const useSubmissionStore = create<SubmissionState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  hydrate: async () => {
    set({ loading: true, error: null })
    try {
      const items = await loadSubmissions()
      set({ items, loading: false })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) })
    }
  },

  create: async (input) => {
    const now = Date.now()
    const submission: Submission = {
      ...input,
      id: makeId("submission"),
      events: [
        makeEvent({
          type: "created",
          fromStatus: null,
          toStatus: input.status,
          timestamp: now,
        }),
      ],
      createdAt: now,
      updatedAt: now,
    }
    const items = [...get().items, submission]
    set({ items, error: null })
    await saveSubmissions(items)
    return submission
  },

  update: async (id, patch) => {
    const current = get().items.find((item) => item.id === id)
    if (!current) {
      throw new Error(`Submission not found: ${id}`)
    }
    const now = Date.now()
    const statusChanged = patch.status !== undefined && patch.status !== current.status
    const updated: Submission = {
      ...current,
      ...patch,
      updatedAt: now,
      events: statusChanged
        ? [
            ...current.events,
            makeEvent({
              type: "status_changed",
              fromStatus: current.status,
              toStatus: patch.status as SubmissionStatus,
              note: patch.notes,
              timestamp: now,
            }),
          ]
        : current.events,
    }
    const items = get().items.map((item) => item.id === id ? updated : item)
    set({ items, error: null })
    await saveSubmissions(items)
    return updated
  },

  delete: async (id) => {
    const items = get().items.filter((item) => item.id !== id)
    set({ items, error: null })
    await saveSubmissions(items)
  },

  reset: () => set({ items: [], loading: false, error: null }),
}))
