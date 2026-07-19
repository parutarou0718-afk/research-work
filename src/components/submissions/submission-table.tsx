import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import type { Submission } from "@/types/submission"
import { isSubmissionOverdue, submissionStatusLabelKey } from "./submission-view-model"
import { SubmissionStatusBadge } from "./submission-status-badge"

function displayDate(value: string | null): string {
  return value || "—"
}

export function SubmissionTable({
  items,
  onEdit,
  onDelete,
}: {
  items: Submission[]
  onEdit: (submission: Submission) => void
  onDelete: (submission: Submission) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-muted/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.paper")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.journal")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.submittedAt")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.status")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.round")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.responseDueAt")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.manuscriptId")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.updatedAt")}</th>
              <th className="px-3 py-2 font-medium">{t("submissions.columns.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const overdue = isSubmissionOverdue(item)
              return (
                <tr key={item.id} className="border-t hover:bg-muted/30">
                  <td className="max-w-[220px] truncate px-3 py-2 font-medium" title={item.paperTitle}>
                    {item.paperTitle}
                  </td>
                  <td className="px-3 py-2">{item.journalName}</td>
                  <td className="px-3 py-2">{displayDate(item.submittedAt)}</td>
                  <td className="px-3 py-2">
                    <SubmissionStatusBadge
                      status={item.status}
                      label={overdue ? t("submissions.overdue") : t(submissionStatusLabelKey(item.status))}
                      overdue={overdue}
                    />
                  </td>
                  <td className="px-3 py-2">{item.currentRound}</td>
                  <td className={overdue ? "px-3 py-2 font-medium text-red-600" : "px-3 py-2"}>
                    {displayDate(item.responseDueAt)}
                  </td>
                  <td className="px-3 py-2">{item.manuscriptId || "—"}</td>
                  <td className="px-3 py-2">{new Date(item.updatedAt).toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                        {t("common.edit")}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(item)}>
                        {t("common.delete")}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
