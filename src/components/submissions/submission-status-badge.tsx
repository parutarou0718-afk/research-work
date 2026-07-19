import type { SubmissionStatus } from "@/types/submission"
import { cn } from "@/lib/utils"

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  preparing: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  under_review: "bg-indigo-100 text-indigo-700 border-indigo-200",
  minor_revision: "bg-amber-100 text-amber-700 border-amber-200",
  major_revision: "bg-orange-100 text-orange-700 border-orange-200",
  revised: "bg-cyan-100 text-cyan-700 border-cyan-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  withdrawn: "bg-zinc-100 text-zinc-700 border-zinc-200",
}

export function SubmissionStatusBadge({
  status,
  label,
  overdue = false,
}: {
  status: SubmissionStatus
  label: string
  overdue?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        overdue ? "border-red-200 bg-red-50 text-red-700" : STATUS_CLASS[status],
      )}
    >
      {label}
    </span>
  )
}
