import { useEffect, useState } from "react"
import { open } from "@tauri-apps/plugin-dialog"
import { Button } from "@/components/ui/button"
import {
  DEFAULT_PLUGIN_EXPORT_PREFERENCES,
  loadPluginExportPreferences,
  savePluginExportPreferences,
  type PluginExportPreferences,
} from "@/core/plugins/export/preferences"
import type { PluginExportFormat } from "@/core/plugins/export/types"

const FORMAT_OPTIONS: Array<{ value: PluginExportFormat; label: string }> = [
  { value: "docx", label: "Word (.docx)" },
  { value: "pdf", label: "PDF (.pdf)" },
  { value: "markdown", label: "Markdown (.md)" },
  { value: "json", label: "JSON (.json)" },
]

export function PluginExportSection() {
  const [preferences, setPreferences] = useState<PluginExportPreferences>(DEFAULT_PLUGIN_EXPORT_PREFERENCES)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadPluginExportPreferences().then(setPreferences).catch(() => {
      setMessage("Unable to load export preferences.")
    })
  }, [])

  async function chooseFolder() {
    const selected = await open({ directory: true, multiple: false, defaultPath: preferences.defaultDirectory || undefined })
    if (typeof selected === "string") {
      setPreferences((current) => ({ ...current, defaultDirectory: selected }))
      setMessage(null)
    }
  }

  function toggleFormat(format: PluginExportFormat) {
    setPreferences((current) => {
      const formats = current.formats.includes(format)
        ? current.formats.filter((value) => value !== format)
        : [...current.formats, format]
      return { ...current, formats: formats.length > 0 ? formats : current.formats }
    })
  }

  async function save() {
    if (!preferences.defaultDirectory.trim()) {
      setMessage("Choose a default export folder first.")
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await savePluginExportPreferences(preferences)
      setMessage("Export preferences saved.")
    } catch {
      setMessage("Unable to save export preferences.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">插件导出</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          插件记录保留在本机。导出时只写入你选择的文件夹，不会上传到 PandaWiki。
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">默认导出文件夹</p>
        <div className="flex gap-2">
          <input readOnly value={preferences.defaultDirectory} placeholder="选择用于保存插件报告的文件夹"
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
          <Button type="button" variant="outline" onClick={() => void chooseFolder()}>选择文件夹</Button>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">默认格式</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {FORMAT_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <input type="checkbox" checked={preferences.formats.includes(option.value)} onChange={() => toggleFormat(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <Button type="button" onClick={() => void save()} disabled={saving}>
        {saving ? "正在保存…" : "保存导出设置"}
      </Button>
    </section>
  )
}
