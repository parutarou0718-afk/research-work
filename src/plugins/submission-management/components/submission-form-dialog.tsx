import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CreateSubmissionInput, Submission, SubmissionStatus } from "../domain/submission"
import { SUBMISSION_STATUSES } from "../domain/submission"
import type { PaperOption } from "./paper-options"
import {
  isBlockingValidationIssue,
  submissionStatusLabelKey,
  validateSubmissionInput,
  validationIssueLabelKey,
} from "./submission-view-model"

const EMPTY_FORM: CreateSubmissionInput = {
  paperPath: "",
  paperTitle: "",
  journalName: "",
  manuscriptId: "",
  submittedAt: null,
  status: "preparing",
  currentRound: 1,
  responseDueAt: null,
  revisedAt: null,
  acceptedAt: null,
  publishedAt: null,
  correspondingAuthor: "",
  notes: "",
}

function inputFromSubmission(submission: Submission | null): CreateSubmissionInput {
  if (!submission) return EMPTY_FORM
  const {
    paperPath,
    paperTitle,
    journalName,
    manuscriptId,
    submittedAt,
    status,
    currentRound,
    responseDueAt,
    revisedAt,
    acceptedAt,
    publishedAt,
    correspondingAuthor,
    notes,
  } = submission
  return {
    paperPath,
    paperTitle,
    journalName,
    manuscriptId,
    submittedAt,
    status,
    currentRound,
    responseDueAt,
    revisedAt,
    acceptedAt,
    publishedAt,
    correspondingAuthor,
    notes,
  }
}

function dateToInput(value: string | null): string {
  return value ?? ""
}

function inputToDate(value: string): string | null {
  return value.trim() ? value : null
}

export function SubmissionFormDialog({
  open,
  mode,
  paperOptions,
  submission,
  onOpenChange,
  onSave,
}: {
  open: boolean
  mode: "create" | "edit"
  paperOptions: PaperOption[]
  submission: Submission | null
  onOpenChange: (open: boolean) => void
  onSave: (input: CreateSubmissionInput) => Promise<void>
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<CreateSubmissionInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(inputFromSubmission(submission))
      setSubmitted(false)
      setSaving(false)
    }
  }, [open, submission])

  const issues = useMemo(() => validateSubmissionInput(form), [form])
  const blockingIssues = issues.filter(isBlockingValidationIssue)
  const warnings = issues.filter((issue) => !isBlockingValidationIssue(issue))

  function update<K extends keyof CreateSubmissionInput>(key: K, value: CreateSubmissionInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handlePaperChange(path: string) {
    const selected = paperOptions.find((option) => option.path === path)
    setForm((current) => ({
      ...current,
      paperPath: selected?.path ?? "",
      paperTitle: selected?.title ?? "",
    }))
  }

  async function handleSave() {
    setSubmitted(true)
    if (blockingIssues.length > 0) return
    setSaving(true)
    try {
      await onSave({
        ...form,
        journalName: form.journalName.trim(),
        manuscriptId: form.manuscriptId.trim(),
        correspondingAuthor: form.correspondingAuthor.trim(),
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const visibleBlockingIssues = submitted ? blockingIssues : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("submissions.dialog.createTitle") : t("submissions.dialog.editTitle")}
          </DialogTitle>
          <DialogDescription>{t("submissions.dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="submission-paper">{t("submissions.fields.paper")}</Label>
            <select
              id="submission-paper"
              className="mt-2 h-8 w-full rounded-lg border bg-background px-2 text-sm"
              value={form.paperPath}
              onChange={(event) => handlePaperChange(event.target.value)}
            >
              <option value="">{t("submissions.dialog.selectPaper")}</option>
              {paperOptions.map((option) => (
                <option key={option.path} value={option.path}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>

          <Field label={t("submissions.fields.journalName")}>
            <Input value={form.journalName} onChange={(event) => update("journalName", event.target.value)} />
          </Field>
          <Field label={t("submissions.fields.manuscriptId")}>
            <Input value={form.manuscriptId} onChange={(event) => update("manuscriptId", event.target.value)} />
          </Field>
          <Field label={t("submissions.fields.status")}>
            <select
              className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
              value={form.status}
              onChange={(event) => update("status", event.target.value as SubmissionStatus)}
            >
              {SUBMISSION_STATUSES.map((status) => (
                <option key={status} value={status}>{t(submissionStatusLabelKey(status))}</option>
              ))}
            </select>
          </Field>
          <Field label={t("submissions.fields.currentRound")}>
            <Input
              type="number"
              min={1}
              value={form.currentRound}
              onChange={(event) => update("currentRound", Number(event.target.value))}
            />
          </Field>
          <Field label={t("submissions.fields.submittedAt")}>
            <Input type="date" value={dateToInput(form.submittedAt)} onChange={(event) => update("submittedAt", inputToDate(event.target.value))} />
          </Field>
          <Field label={t("submissions.fields.responseDueAt")}>
            <Input type="date" value={dateToInput(form.responseDueAt)} onChange={(event) => update("responseDueAt", inputToDate(event.target.value))} />
          </Field>
          <Field label={t("submissions.fields.revisedAt")}>
            <Input type="date" value={dateToInput(form.revisedAt)} onChange={(event) => update("revisedAt", inputToDate(event.target.value))} />
          </Field>
          <Field label={t("submissions.fields.acceptedAt")}>
            <Input type="date" value={dateToInput(form.acceptedAt)} onChange={(event) => update("acceptedAt", inputToDate(event.target.value))} />
          </Field>
          <Field label={t("submissions.fields.publishedAt")}>
            <Input type="date" value={dateToInput(form.publishedAt)} onChange={(event) => update("publishedAt", inputToDate(event.target.value))} />
          </Field>
          <Field label={t("submissions.fields.correspondingAuthor")}>
            <Input value={form.correspondingAuthor} onChange={(event) => update("correspondingAuthor", event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Label htmlFor="submission-notes">{t("submissions.fields.notes")}</Label>
            <textarea
              id="submission-notes"
              className="mt-2 min-h-24 w-full rounded-lg border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
            />
          </div>
        </div>

        {(visibleBlockingIssues.length > 0 || warnings.length > 0) && (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs">
            {visibleBlockingIssues.map((issue) => (
              <div key={issue} className="text-red-600">{t(validationIssueLabelKey(issue))}</div>
            ))}
            {warnings.map((issue) => (
              <div key={issue} className="text-amber-700">{t(validationIssueLabelKey(issue))}</div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t("submissions.dialog.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}
