import { useEffect, useMemo, useState } from "react"
import { Download, Pencil, Plus, Trash2, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { loadPluginExportPreferences } from "@/core/plugins/export/preferences"
import { writePluginExport } from "@/core/plugins/export/native"
import type { PluginHost } from "@/core/plugins/host/types"
import type { WorkspaceSuiteId } from "../domain/workspace-suites"
import {
  emptyWorkspaceRecordData,
  normalizeWorkspaceRecordData,
  removeWorkspaceRecord,
  resolveWorkspaceReferences,
  upsertWorkspaceRecord,
  WORKSPACE_MODULE_SCHEMAS,
  type WorkspaceRecord,
  type WorkspaceRecordData,
} from "../domain/workspace-records"

interface WorkspaceRecordsProps {
  host: PluginHost
  suiteId: WorkspaceSuiteId
  moduleId: string
}

export function WorkspaceRecords({ host, suiteId, moduleId }: WorkspaceRecordsProps) {
  const { i18n } = useTranslation()
  const chinese = i18n.language.startsWith("zh")
  const schema = WORKSPACE_MODULE_SCHEMAS[suiteId][moduleId]
  const storage = useMemo(() => host.storage.forPlugin(`official.${suiteId}-workspace`), [host, suiteId])
  const [data, setData] = useState<WorkspaceRecordData>(emptyWorkspaceRecordData)
  const [references, setReferences] = useState<Awaited<ReturnType<NonNullable<PluginHost["documents"]["listReferences"]>>>>([])
  const [draft, setDraft] = useState<WorkspaceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void Promise.all([
      storage.readJson<unknown>("workspace-records.json"),
      host.documents.listReferences?.() ?? Promise.resolve([]),
    ]).then(([saved, availableReferences]) => {
      if (cancelled) return
      setData(normalizeWorkspaceRecordData(saved))
      setReferences(availableReferences)
    }).catch(() => {
      if (!cancelled) setMessage(chinese ? "无法读取工作台数据。" : "Unable to load workspace data.")
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [chinese, host.documents, storage])

  if (!schema) return null
  const records = data.records.filter((record) => record.moduleId === moduleId).sort((left, right) => right.updatedAt - left.updatedAt)

  function newRecord() {
    const now = Date.now()
    setDraft({ id: crypto.randomUUID(), moduleId, title: "", summary: "", status: schema.statuses[0], date: "", referenceIds: [], createdAt: now, updatedAt: now })
    setMessage(null)
  }

  async function saveRecord() {
    if (!draft?.title.trim() || saving) return
    setSaving(true)
    try {
      const nextRecord = { ...draft, title: draft.title.trim(), updatedAt: Date.now() }
      const next = upsertWorkspaceRecord(data, nextRecord)
      await storage.writeJson("workspace-records.json", next)
      setData(next)
      setDraft(null)
      setMessage(chinese ? "记录已保存到本机。" : "Record saved locally.")
    } catch {
      setMessage(chinese ? "无法保存工作台记录。" : "Unable to save this workspace record.")
    } finally {
      setSaving(false)
    }
  }

  async function deleteRecord(id: string) {
    const next = removeWorkspaceRecord(data, id)
    try {
      await storage.writeJson("workspace-records.json", next)
      setData(next)
      if (draft?.id === id) setDraft(null)
    } catch {
      setMessage(chinese ? "无法删除工作台记录。" : "Unable to delete this workspace record.")
    }
  }

  async function exportRecords() {
    const preferences = await loadPluginExportPreferences()
    if (!preferences.defaultDirectory) {
      setMessage(chinese ? "请先在设置中选择插件导出的默认文件夹。" : "Choose a default plugin export folder in Settings first.")
      return
    }
    try {
      const exportReferences = records.flatMap((record) => resolveWorkspaceReferences(record, references)).filter((reference, index, all) => all.findIndex((item) => item.id === reference.id) === index)
      await writePluginExport({
        pluginId: `official.${suiteId}-workspace`,
        title: `${schema.title} report`,
        createdAt: new Date().toISOString(),
        metadata: { workspace: suiteId, module: moduleId, recordCount: records.length },
        sections: records.map((record) => ({ heading: record.title, body: [record.summary, record.date ? `Date: ${record.date}` : "", `Status: ${record.status}`].filter(Boolean).join("\n\n") })),
        structuredData: { records },
        references: exportReferences.map((reference) => ({ title: reference.title, nodeId: reference.id, locator: reference.locator })),
      }, { directory: preferences.defaultDirectory, baseName: `${suiteId}-${moduleId}`, formats: preferences.formats })
      setMessage(chinese ? "报告已导出。" : "Report exported.")
    } catch {
      setMessage(chinese ? "导出失败，请检查导出设置。" : "Export failed. Check export settings.")
    }
  }

  const title = chinese ? translateModule(suiteId, moduleId) : schema.title
  return (
    <section className="mt-6 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{chinese ? "记录保存在本机；可关联当前项目中你有权限访问的资料。" : "Records stay on this device and can reference materials you may access in the active project."}</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void exportRecords()} className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm"><Download className="h-4 w-4" />{chinese ? "导出" : "Export"}</button>
          <button type="button" onClick={newRecord} className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground"><Plus className="h-4 w-4" />{chinese ? "新建记录" : "New record"}</button>
        </div>
      </div>
      {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
      {draft && <RecordEditor chinese={chinese} schema={schema} draft={draft} references={references} saving={saving} onChange={setDraft} onSave={() => void saveRecord()} onCancel={() => setDraft(null)} />}
      {loading ? <p className="mt-5 text-sm text-muted-foreground">{chinese ? "正在读取记录…" : "Loading records…"}</p> : records.length === 0 ? <p className="mt-5 rounded-md border border-dashed p-4 text-sm text-muted-foreground">{chinese ? "暂无记录。点击“新建记录”开始。" : "No records yet. Create one to begin."}</p> : <ul className="mt-5 space-y-2">{records.map((record) => <li key={record.id} className="rounded-lg border p-3"><div className="flex gap-3"><button type="button" className="min-w-0 flex-1 text-left" onClick={() => setDraft(record)}><p className="font-medium">{record.title}</p>{record.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{record.summary}</p>}<p className="mt-2 text-xs text-muted-foreground">{record.status}{record.date ? ` · ${record.date}` : ""}{record.referenceIds.length ? ` · ${record.referenceIds.length} ${chinese ? "份资料" : "references"}` : ""}</p></button><button type="button" aria-label={chinese ? "删除记录" : "Delete record"} onClick={() => void deleteRecord(record.id)} className="self-start p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div></li>)}</ul>}
    </section>
  )
}

function RecordEditor({ chinese, schema, draft, references, saving, onChange, onSave, onCancel }: {
  chinese: boolean
  schema: (typeof WORKSPACE_MODULE_SCHEMAS)[WorkspaceSuiteId][string]
  draft: WorkspaceRecord
  references: Awaited<ReturnType<NonNullable<PluginHost["documents"]["listReferences"]>>>
  saving: boolean
  onChange: (value: WorkspaceRecord) => void
  onSave: () => void
  onCancel: () => void
}) {
  const update = <K extends keyof WorkspaceRecord>(key: K, value: WorkspaceRecord[K]) => onChange({ ...draft, [key]: value })
  return <div className="mt-5 space-y-3 rounded-lg border bg-muted/20 p-4">
    <div className="flex items-center justify-between"><p className="font-medium">{draft.title ? (chinese ? "编辑记录" : "Edit record") : (chinese ? "新建记录" : "New record")}</p><button type="button" onClick={onCancel}><X className="h-4 w-4" /></button></div>
    <input value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder={chinese ? "标题" : "Title"} className="h-9 w-full rounded-md border bg-background px-3 text-sm" autoFocus />
    <textarea value={draft.summary} onChange={(event) => update("summary", event.target.value)} placeholder={chinese ? "摘要、说明或下一步行动" : "Summary, notes, or next action"} className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" />
    <div className="grid gap-3 sm:grid-cols-2">
      <select value={draft.status} onChange={(event) => update("status", event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">{schema.statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
      {schema.supportsDate && <input type="date" value={draft.date} onChange={(event) => update("date", event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" />}
    </div>
    {schema.supportsReferences && references.length > 0 && <label className="block text-sm"><span className="mb-1 block text-muted-foreground">{chinese ? "关联资料" : "References"}</span><select multiple value={draft.referenceIds} onChange={(event) => update("referenceIds", [...event.currentTarget.selectedOptions].map((option) => option.value))} className="min-h-24 w-full rounded-md border bg-background p-2 text-sm">{references.map((reference) => <option key={reference.id} value={reference.id}>{reference.title}</option>)}</select></label>}
    <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="h-9 rounded-md border px-3 text-sm">{chinese ? "取消" : "Cancel"}</button><button type="button" disabled={!draft.title.trim() || saving} onClick={onSave} className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"><Pencil className="h-4 w-4" />{chinese ? "保存" : "Save"}</button></div>
  </div>
}

function translateModule(suiteId: WorkspaceSuiteId, moduleId: string): string {
  const names: Record<string, string> = { projects: "研究项目", literature: "文献与作者", timeline: suiteId === "legal" ? "证据时间线" : suiteId === "research" ? "研究时间线" : "销售跟进", report: suiteId === "legal" ? "法律意见报告" : suiteId === "investment" ? "投研报告" : suiteId === "business" ? "商业报告" : "文献综述报告", matters: "案件与事项", contracts: "合同审查", opinion: "法律意见报告", companies: "公司与主体", diligence: "尽调事项", risks: "风险矩阵", customers: "客户与项目", followups: "销售跟进", knowledge: "企业知识" }
  return names[moduleId] ?? moduleId
}
