import { useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { readFile } from "@/commands/fs"
import { useSubmissionStore } from "../store/submission-store"
import { useWikiStore } from "@/stores/wiki-store"
import type { CreateSubmissionInput, Submission, SubmissionStatus } from "../domain/submission"
import {
  buildSubmissionStats,
  filterSubmissions,
  sortSubmissions,
  type SortDirection,
  type SubmissionSortKey,
} from "./submission-view-model"
import { buildPaperOptionsFromFiles, markdownPathsFromFileTree, type PaperOption } from "./paper-options"
import { SubmissionStatsCards } from "./submission-stats"
import { SubmissionFilters } from "./submission-filters"
import { SubmissionTable } from "./submission-table"
import { SubmissionFormDialog } from "./submission-form-dialog"

export function SubmissionsView() {
  const { t } = useTranslation()
  const project = useWikiStore((s) => s.project)
  const fileTree = useWikiStore((s) => s.fileTree)
  const projectPathIndex = useWikiStore((s) => s.projectPathIndex)
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
      const paths = markdownPathsFromFileTree(fileTree)
      const files = await Promise.all(
        paths.map(async (path) => {
          try {
            return { path, content: await readFile(path) }
          } catch {
            return null
          }
        }),
      )
      if (cancelled) return
      const indexedSourcePaths = [...projectPathIndex.byPath.values()]
        .map((entry) => entry.path)
      setPaperOptions(buildPaperOptionsFromFiles(
        project.path,
        fileTree,
        files.filter((file): file is { path: string; content: string } => file !== null),
        indexedSourcePaths,
      ))
    }
    void loadOptions()
    return () => {
      cancelled = true
    }
  }, [fileTree, project, projectPathIndex])

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
      await updateSubmission(project.path, editing.id, input)
    } else {
      await createSubmission(project.path, input)
    }
  }

  async function handleDelete(submission: Submission) {
    if (!project) return
    if (!window.confirm(t("submissions.confirmDelete", { title: submission.paperTitle }))) return
    await deleteSubmission(project.path, submission.id)
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
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
          <SubmissionTable items={visibleItems} onEdit={openEditDialog} onDelete={handleDelete} />
        )}

        <SubmissionFormDialog
          open={dialogOpen}
          mode={editing ? "edit" : "create"}
          submission={editing}
          paperOptions={paperOptions}
          onOpenChange={setDialogOpen}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
