import { useTranslation } from "react-i18next"
import type { SubmissionStats } from "./submission-view-model"

export function SubmissionStatsCards({ stats }: { stats: SubmissionStats }) {
  const { t } = useTranslation()
  const cards = [
    { key: "total", label: t("submissions.stats.total"), value: stats.total },
    { key: "submitted", label: t("submissions.status.submitted"), value: stats.byStatus.submitted },
    { key: "under_review", label: t("submissions.status.under_review"), value: stats.byStatus.under_review },
    { key: "revision", label: t("submissions.stats.revision"), value: stats.byStatus.minor_revision + stats.byStatus.major_revision },
    { key: "overdue", label: t("submissions.stats.overdue"), value: stats.overdue },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.key} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold">{card.value}</div>
        </div>
      ))}
    </div>
  )
}
