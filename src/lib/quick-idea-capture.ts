import type { IdeaCaptureInput } from "@/lib/idea-capture"

const MAX_QUICK_TITLE_LENGTH = 80

function compactTitle(text: string): string {
  if (text.length <= MAX_QUICK_TITLE_LENGTH) return text
  const candidate = text.slice(0, MAX_QUICK_TITLE_LENGTH - 3).trimEnd()
  const lastSpace = candidate.lastIndexOf(" ")
  if (lastSpace > 24) return `${candidate.slice(0, lastSpace)}...`
  return `${candidate}...`
}

export function buildQuickIdeaCaptureInput(text: string, now = new Date()): IdeaCaptureInput {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (!normalized) throw new Error("Quick capture text is required.")

  return {
    title: compactTitle(normalized),
    content: normalized,
    tags: [],
    now,
  }
}
