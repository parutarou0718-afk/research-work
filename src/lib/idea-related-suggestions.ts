import {
  suggestRelatedKnowledgeOptions,
  type RelatedKnowledgeOption,
} from "@/components/ideas/related-knowledge-options"
import { normalizePath } from "@/lib/path-utils"
import { searchWiki, type SearchResult } from "@/lib/search"

export interface SuggestIdeaRelatedKnowledgeInput {
  projectPath: string
  title: string
  content: string
  options: RelatedKnowledgeOption[]
  selectedTargets?: ReadonlySet<string>
  limit?: number
  searchWiki?: (projectPath: string, query: string) => Promise<SearchResult[]>
}

export interface IdeaRelatedSuggestionResult {
  suggestions: RelatedKnowledgeOption[]
  source: "wiki-search" | "local"
}

function normalizeComparablePath(path: string): string {
  return normalizePath(path).replace(/\/+$/, "")
}

function localFallback({
  title,
  content,
  options,
  selectedTargets,
  limit,
}: Pick<SuggestIdeaRelatedKnowledgeInput, "title" | "content" | "options" | "selectedTargets" | "limit">): RelatedKnowledgeOption[] {
  return suggestRelatedKnowledgeOptions({
    title,
    content,
    options,
    selectedTargets,
    limit,
  })
}

export async function suggestIdeaRelatedKnowledge({
  projectPath,
  title,
  content,
  options,
  selectedTargets = new Set(),
  limit = 10,
  searchWiki: search = searchWiki,
}: SuggestIdeaRelatedKnowledgeInput): Promise<RelatedKnowledgeOption[]> {
  const query = `${title.trim()}\n\n${content.trim()}`.trim()
  if (!query) return []

  const optionByPath = new Map(options.map((option) => [normalizeComparablePath(option.path), option]))

  try {
    const results = await search(projectPath, query)
    const suggestions: RelatedKnowledgeOption[] = []
    const seenTargets = new Set<string>()

    for (const result of results) {
      const option = optionByPath.get(normalizeComparablePath(result.path))
      if (!option) continue
      if (selectedTargets.has(option.target)) continue
      if (seenTargets.has(option.target)) continue
      suggestions.push(option)
      seenTargets.add(option.target)
      if (suggestions.length >= limit) return suggestions
    }

    if (suggestions.length > 0) return suggestions
  } catch {
    // Search can depend on vector/embedding setup. Idea capture should stay
    // usable even when semantic search is unavailable.
  }

  return localFallback({
    title,
    content,
    options,
    selectedTargets,
    limit,
  })
}
