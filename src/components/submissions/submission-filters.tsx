import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { SUBMISSION_STATUSES, type SubmissionStatus } from "@/types/submission"
import type { SortDirection, SubmissionSortKey } from "./submission-view-model"
import { submissionStatusLabelKey } from "./submission-view-model"

export function SubmissionFilters({
  status,
  journal,
  sortKey,
  sortDirection,
  onStatusChange,
  onJournalChange,
  onSortKeyChange,
  onSortDirectionChange,
}: {
  status: SubmissionStatus | "all"
  journal: string
  sortKey: SubmissionSortKey
  sortDirection: SortDirection
  onStatusChange: (status: SubmissionStatus | "all") => void
  onJournalChange: (journal: string) => void
  onSortKeyChange: (key: SubmissionSortKey) => void
  onSortDirectionChange: (direction: SortDirection) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <select
        className="h-8 rounded-lg border bg-background px-2 text-sm"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as SubmissionStatus | "all")}
        aria-label={t("submissions.filters.status")}
      >
        <option value="all">{t("submissions.filters.allStatuses")}</option>
        {SUBMISSION_STATUSES.map((item) => (
          <option key={item} value={item}>{t(submissionStatusLabelKey(item))}</option>
        ))}
      </select>
      <Input
        className="w-56"
        value={journal}
        onChange={(event) => onJournalChange(event.target.value)}
        placeholder={t("submissions.filters.journalPlaceholder")}
        aria-label={t("submissions.filters.journal")}
      />
      <select
        className="h-8 rounded-lg border bg-background px-2 text-sm"
        value={sortKey}
        onChange={(event) => onSortKeyChange(event.target.value as SubmissionSortKey)}
        aria-label={t("submissions.filters.sortBy")}
      >
        <option value="submittedAt">{t("submissions.fields.submittedAt")}</option>
        <option value="responseDueAt">{t("submissions.fields.responseDueAt")}</option>
        <option value="updatedAt">{t("submissions.fields.updatedAt")}</option>
      </select>
      <select
        className="h-8 rounded-lg border bg-background px-2 text-sm"
        value={sortDirection}
        onChange={(event) => onSortDirectionChange(event.target.value as SortDirection)}
        aria-label={t("submissions.filters.sortDirection")}
      >
        <option value="asc">{t("submissions.filters.ascending")}</option>
        <option value="desc">{t("submissions.filters.descending")}</option>
      </select>
    </div>
  )
}
