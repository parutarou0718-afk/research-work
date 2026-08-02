import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Plus } from "lucide-react"
import { open } from "@tauri-apps/plugin-dialog"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useSubmissionStore } from "../store/submission-store"
import type { PluginHost } from "@/core/plugins/host/types"
import { usePluginProject } from "@/core/plugins/host/usePluginProject"
import type { CreateSubmissionInput, Submission, SubmissionStatus } from "../domain/submission"
import {
  buildSubmissionStats,
  filterSubmissions,
  sortSubmissions,
  type SortDirection,
  type SubmissionSortKey,
} from "./submission-view-model"
import { buildPaperOptionsFromFiles, type PaperOption } from "./paper-options"
import { SubmissionStatsCards } from "./submission-stats"
import { SubmissionFilters } from "./submission-filters"
import { SubmissionTable } from "./submission-table"
import { SubmissionFormDialog } from "./submission-form-dialog"
import { shouldUseManualSubmissionReference } from "./submission-project-mode"
import { buildSubmissionExport, submissionExportBaseName } from "../export/submission-export"
import { loadPluginExportPreferences } from "@/core/plugins/export/preferences"
import { writePluginExport } from "@/core/plugins/export/native"

export function SubmissionsView({ host, onReturnToWorkspace }: { host: PluginHost; onReturnToWorkspace?: () => void }) {
  const { t } = useTranslation()
  const project = usePluginProject(host)
  const items = useSubmissionStore((s) => s.items)
  const createSubmission = useSubmissionStore((s) => s.create)
  const updateSubmission = useSubmissionStore((s) => s.update)
  const deleteSubmission = useSubmissionStore((s) => s.delete)
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "all">("all")
  const [journalFilter, setJournalFilter] = useState("")
  const [sortKey, setSortKey] = useState<SubmissionSortKey>("updatedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [paperOptions, setPaperOptions] = useState<PaperOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Submission | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadOptions() {
      if (!project) {
        setPaperOptions([])
        return
      }
      if (project.source === "pandawiki") {
        const references = await host.documents.listReferences?.() ?? []
        if (!cancelled) setPaperOptions(references.map((reference) => ({
          path: reference.locator,
          title: reference.title,
          isPaperTyped: false,
        })))
        return
      }
      const paths = host.documents.listMarkdownPaths()
      const files = await Promise.all(
        paths.map(async (path) => {
          try {
            return { path, content: await host.documents.readText(path) }
          } catch {
            return null
          }
        }),
      )
      if (cancelled) return
      const sourcePaths = [
        ...host.documents.listSelectableSourcePaths(),
        ...host.documents.listIndexedSourcePaths(),
      ]
      setPaperOptions(buildPaperOptionsFromFiles(
        project.path,
        paths,
        files.filter((file): file is { path: string; content: string } => file !== null),
        sourcePaths,
      ))
    }
    void loadOptions()
    return () => {
      cancelled = true
    }
  }, [host, project])

  const stats = useMemo(() => buildSubmissionStats(items), [items])
  const visibleItems = useMemo(() => {
    const filtered = filterSubmissions(items, { status: statusFilter, journal: journalFilter })
    return sortSubmissions(filtered, sortKey, sortDirection)
  }, [items, journalFilter, sortDirection, sortKey, statusFilter])

  function openCreateDialog() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEditDialog(submission: Submission) {
    setEditing(submission)
    setDialogOpen(true)
  }

  async function handleSave(input: CreateSubmissionInput) {
    if (!project) return
    if (editing) {
      await updateSubmission(editing.id, input)
    } else {
      await createSubmission(input)
    }
  }

  async function handleDelete(submission: Submission) {
    if (!project) return
    if (!window.confirm(t("submissions.confirmDelete", { title: submission.paperTitle }))) return
    await deleteSubmission(submission.id)
  }

  async function handleExport(submission: Submission) {
    try {
      const preferences = await loadPluginExportPreferences()
      const directory = preferences.defaultDirectory || await open({ directory: true, multiple: false })
      if (typeof directory !== "string") return
      const files = await writePluginExport(buildSubmissionExport(submission), {
        directory,
        baseName: submissionExportBaseName(submission),
        formats: preferences.formats,
      })
      window.alert(`Exported ${files.length} file(s).`)
    } catch (error) {
      console.error("[plugin-export] submission export failed", { name: error instanceof Error ? error.name : typeof error })
      window.alert("Unable to export this submission. Check the export folder and format settings.")
    }
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {onReturnToWorkspace && <Button type="button" variant="outline" size="sm" className="mb-3" onClick={onReturnToWorkspace}><ArrowLeft className="h-4 w-4" />{"\u8fd4\u56de\u79d1\u7814\u5de5\u4f5c\u53f0"}</Button>}
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("submissions.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("submissions.subtitle")}</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            {t("submissions.actions.new")}
          </Button>
        </div>

        <SubmissionStatsCards stats={stats} />

        <SubmissionFilters
          status={statusFilter}
          journal={journalFilter}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onStatusChange={setStatusFilter}
          onJournalChange={setJournalFilter}
          onSortKeyChange={setSortKey}
          onSortDirectionChange={setSortDirection}
        />

        {items.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
            <h2 className="text-lg font-semibold">{t("submissions.empty.title")}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("submissions.empty.description")}</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              {t("submissions.actions.new")}
            </Button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            {t("submissions.empty.noMatches")}
          </div>
        ) : (
          <SubmissionTable items={visibleItems} onEdit={openEditDialog} onDelete={handleDelete} onExport={handleExport} />
        )}

        <SubmissionFormDialog
          open={dialogOpen}
          mode={editing ? "edit" : "create"}
          submission={editing}
          paperOptions={paperOptions}
          manualPaperReference={shouldUseManualSubmissionReference(project) && paperOptions.length === 0}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
