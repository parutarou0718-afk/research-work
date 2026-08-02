import { describe, expect, it } from "vitest"
import { emptyWorkspaceRecordData, normalizeWorkspaceRecordData, removeWorkspaceRecord, upsertWorkspaceRecord } from "./workspace-records"

describe("workspace records", () => {
  it("normalizes legacy or malformed local storage without losing valid records", () => {
    const data = normalizeWorkspaceRecordData({ records: [{ id: "1", moduleId: "customers", title: "Acme" }, null] })
    expect(data.version).toBe(2)
    expect(data.records).toHaveLength(1)
    expect(data.records[0].status).toBe("planned")
  })

  it("upserts and removes a record by its stable id", () => {
    const record = { id: "1", moduleId: "customers", title: "Acme", summary: "", status: "lead", date: "", referenceIds: [], createdAt: 1, updatedAt: 1 }
    const updated = upsertWorkspaceRecord(emptyWorkspaceRecordData(), { ...record, title: "Acme Ltd" })
    expect(updated.records).toHaveLength(1)
    expect(updated.records[0].title).toBe("Acme Ltd")
    expect(removeWorkspaceRecord(updated, "1").records).toEqual([])
  })
})
