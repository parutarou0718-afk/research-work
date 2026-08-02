export interface LocalWorkspaceRecord {
  id: string
  title: string
  detail: string
  createdAt: number
}

export interface LocalWorkspaceData {
  version: 1
  records: LocalWorkspaceRecord[]
}

export function createEmptyLocalWorkspaceData(): LocalWorkspaceData {
  return { version: 1, records: [] }
}

export function appendLocalWorkspaceRecord(
  current: LocalWorkspaceData,
  record: LocalWorkspaceRecord,
): LocalWorkspaceData {
  return { ...current, records: [...current.records, record] }
}
