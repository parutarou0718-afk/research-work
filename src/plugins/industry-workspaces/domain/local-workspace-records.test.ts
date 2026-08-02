import { describe, expect, it } from "vitest"
import { appendLocalWorkspaceRecord, createEmptyLocalWorkspaceData } from "./local-workspace-records"

describe("local workspace records", () => {
  it("keeps each suite's local records in an explicit versioned data shape", () => {
    expect(createEmptyLocalWorkspaceData()).toEqual({ version: 1, records: [] })
  })

  it("appends a local legal matter without changing existing records", () => {
    const existing = {
      version: 1 as const,
      records: [{ id: "matter-1", title: "Existing matter", detail: "", createdAt: 1 }],
    }

    const next = appendLocalWorkspaceRecord(existing, {
      id: "matter-2",
      title: "New matter",
      detail: "Review contract evidence",
      createdAt: 2,
    })

    expect(next.records.map((record) => record.id)).toEqual(["matter-1", "matter-2"])
  })
})
