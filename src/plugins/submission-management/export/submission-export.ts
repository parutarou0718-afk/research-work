import type { PluginExportModel } from "@/core/plugins/export/types"
import type { Submission } from "../domain/submission"

export function buildSubmissionExport(submission: Submission): PluginExportModel {
  return {
    pluginId: "official.submission-management",
    title: `Submission: ${submission.paperTitle}`,
    createdAt: new Date().toISOString(),
    metadata: {
      journal: submission.journalName,
      status: submission.status,
      manuscriptId: submission.manuscriptId || null,
      currentRound: submission.currentRound,
      submittedAt: submission.submittedAt,
      responseDueAt: submission.responseDueAt,
      correspondingAuthor: submission.correspondingAuthor || null,
    },
    sections: [
      {
        heading: "Submission notes",
        body: submission.notes || "No notes recorded.",
      },
      {
        heading: "Timeline",
        body: submission.events.length > 0
          ? submission.events.map((event) => `${new Date(event.timestamp).toISOString().slice(0, 10)} — ${event.type}: ${event.note || event.toStatus}`).join("\n")
          : "No timeline events recorded.",
      },
    ],
    structuredData: { submission },
    references: [{
      title: submission.paperTitle,
      locator: submission.paperPath,
    }],
  }
}

export function submissionExportBaseName(submission: Submission): string {
  return `${submission.paperTitle || "submission"}-${new Date(submission.updatedAt).toISOString().slice(0, 10)}`
}
