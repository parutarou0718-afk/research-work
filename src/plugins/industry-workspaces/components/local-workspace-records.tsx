import { useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PluginHost } from "@/core/plugins/host/types"
import type { WorkspaceSuiteId } from "../domain/workspace-suites"
import {
  appendLocalWorkspaceRecord,
  createEmptyLocalWorkspaceData,
  type LocalWorkspaceData,
} from "../domain/local-workspace-records"

const LOCAL_RECORD_COPY: Record<WorkspaceSuiteId, { title: string; description: string; placeholder: string }> = {
  research: { title: "研究项目", description: "本地研究项目记录保存在当前项目中。", placeholder: "例如：汉语结果补语结构研究" },
  legal: { title: "案件 / 事项", description: "本地案件与事项记录保存在当前项目中。", placeholder: "例如：合同争议审查" },
  investment: { title: "尽调事项", description: "本地尽调事项记录保存在当前项目中。", placeholder: "例如：目标公司风险核查" },
}

export function LocalWorkspaceRecords({ host, suiteId }: { host: PluginHost; suiteId: WorkspaceSuiteId }) {
  const { i18n } = useTranslation()
  const storage = useMemo(() => host.storage.forPlugin(`official.${suiteId}-workspace`), [host, suiteId])
  const [data, setData] = useState<LocalWorkspaceData>(createEmptyLocalWorkspaceData)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const copy = LOCAL_RECORD_COPY[suiteId]
  const chinese = i18n.language.startsWith("zh")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void storage.readJson<LocalWorkspaceData>("storage.json")
      .then((saved) => {
        if (!cancelled) setData(saved?.version === 1 && Array.isArray(saved.records) ? saved : createEmptyLocalWorkspaceData())
      })
      .catch(() => {
        if (!cancelled) setData(createEmptyLocalWorkspaceData())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [storage])

  async function addRecord() {
    const trimmed = title.trim()
    if (!trimmed || saving) return
    setSaving(true)
    const next = appendLocalWorkspaceRecord(data, {
      id: crypto.randomUUID(),
      title: trimmed,
      detail: "",
      createdAt: Date.now(),
    })
    try {
      await storage.writeJson("storage.json", next)
      setData(next)
      setTitle("")
    } catch {
      host.notifications.error(chinese ? "无法保存本地工作台记录。" : "Unable to save the local workspace record.")
    } finally {
      setSaving(false)
    }
  }

  const heading = chinese ? copy.title : suiteId === "research" ? "Research projects" : suiteId === "legal" ? "Matters" : "Diligence items"
  const description = chinese ? copy.description : "These local records are stored inside the current project."
  const placeholder = chinese ? copy.placeholder : "Enter a title"

  return (
    <section className="mt-6 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">{heading}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addRecord() }} placeholder={placeholder} className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" />
        <button type="button" onClick={() => void addRecord()} disabled={!title.trim() || saving} className="inline-flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground disabled:opacity-50"><Plus className="h-4 w-4" />{chinese ? "新增" : "Add"}</button>
      </div>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">{chinese ? "正在加载…" : "Loading…"}</p> : data.records.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{chinese ? "还没有记录。" : "No records yet."}</p> : <ul className="mt-4 space-y-2">{data.records.map((record) => <li key={record.id} className="rounded-md border bg-muted/20 px-3 py-2 text-sm"><p className="font-medium">{record.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleDateString()}</p></li>)}</ul>}
    </section>
  )
}
