import type { ProjectPathIndex } from "@/lib/wiki-page-resolver"
import { getFileStem, getRelativePath, normalizePath } from "@/lib/path-utils"

export interface RelatedKnowledgeOption {
  path: string
  target: string
  title: string
}

export interface RelatedKnowledgeSuggestionInput {
  title: string
  content: string
  options: RelatedKnowledgeOption[]
  selectedTargets?: ReadonlySet<string>
  limit?: number
}

const EXCLUDED_WIKI_FILENAMES = new Set(["index.md", "log.md"])

export function buildRelatedKnowledgeOptions(
  projectPath: string,
  index: ProjectPathIndex,
): RelatedKnowledgeOption[] {
  const normalizedProjectPath = normalizePath(projectPath).replace(/\/$/, "")
  const wikiPrefix = `${normalizedProjectPath}/wiki/`

  const options = [...index.byPath.values()]
    .filter((entry) => {
      const path = normalizePath(entry.path)
      if (!path.startsWith(wikiPrefix)) return false
      if (!path.toLowerCase().endsWith(".md")) return false
      if (EXCLUDED_WIKI_FILENAMES.has(entry.name.toLowerCase())) return false
      return true
    })
    .map((entry) => {
      const path = normalizePath(entry.path)
      return {
        path,
        target: getRelativePath(path, normalizedProjectPath),
        title: getFileStem(entry.name),
      }
    })

  return options.sort((a, b) => {
    const byTitle = a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    return byTitle || a.target.localeCompare(b.target)
  })
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
}

function scoreOption(queryTokens: string[], option: RelatedKnowledgeOption): number {
  const title = option.title.toLowerCase()
  const target = option.target.toLowerCase()
  let score = 0

  for (const token of queryTokens) {
    if (title === token) score += 8
    else if (title.includes(token)) score += 4

    if (target.includes(token)) score += 2
  }

  return score
}

export function suggestRelatedKnowledgeOptions({
  title,
  content,
  options,
  selectedTargets = new Set(),
  limit = 10,
}: RelatedKnowledgeSuggestionInput): RelatedKnowledgeOption[] {
  const queryTokens = [...new Set(tokenize(`${title} ${content}`))]
  if (queryTokens.length === 0) return []

  return options
    .filter((option) => !selectedTargets.has(option.target))
    .map((option) => ({
      option,
      score: scoreOption(queryTokens, option),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const byTitle = a.option.title.localeCompare(b.option.title, undefined, { sensitivity: "base" })
      return byTitle || a.option.target.localeCompare(b.option.target)
    })
    .slice(0, Math.max(0, limit))
    .map((item) => item.option)
}
