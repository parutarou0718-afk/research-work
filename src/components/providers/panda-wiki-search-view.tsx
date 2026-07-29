import { useState } from "react"
import { FileText, Search } from "lucide-react"
import { useWikiStore } from "@/stores/wiki-store"
import { isPandaWikiProject } from "@/domain/projects"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import type { KnowledgeSearchResult, SearchProvider } from "@/services/providers/contracts/SearchProvider"

interface PandaWikiSearchViewProps {
  knowledgeProvider: KnowledgeProvider
  searchProvider: SearchProvider
}

/**
 * Read-only remote search. It deliberately does not mount the local
 * filesystem SearchView: PandaWiki resolves authorization and retrieval on
 * the server before this UI sees a result.
 */
export function PandaWikiSearchView({ knowledgeProvider, searchProvider }: PandaWikiSearchViewProps) {
  const activeProject = useWikiStore((state) => state.activeProject)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<KnowledgeSearchResult[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")

  const runSearch = async (): Promise<void> => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || !isPandaWikiProject(activeProject)) return

    const scopeKey = activeProject.scopeKey
    setStatus("loading")
    try {
      const nextResults = await searchProvider.search(activeProject.knowledgeBaseId, trimmedQuery)
      const currentProject = useWikiStore.getState().activeProject
      if (!isPandaWikiProject(currentProject) || currentProject.scopeKey !== scopeKey) return
      setResults(nextResults)
      setStatus("ready")
    } catch {
      setResults([])
      setStatus("error")
    }
  }

  const openResult = async (result: KnowledgeSearchResult): Promise<void> => {
    if (!isPandaWikiProject(activeProject)) return
    const scopeKey = activeProject.scopeKey
    try {
      await useWikiStore.getState().selectProviderNode(knowledgeProvider, result.nodeId)
      const currentProject = useWikiStore.getState().activeProject
      if (currentProject?.source === "pandawiki" && currentProject.scopeKey === scopeKey) {
        useWikiStore.getState().setActiveView("wiki")
      }
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b px-4 py-3">
        <h1 className="text-sm font-semibold">Search PandaWiki knowledge</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Search runs on the server with your PandaWiki permissions.
        </p>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void runSearch()
            }}
            placeholder="Search this knowledge base"
            className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </header>

      {status === "loading" && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Searching PandaWiki…</div>
      )}
      {status === "error" && (
        <div role="alert" className="flex flex-1 items-center justify-center px-6 text-center text-sm text-destructive">
          PandaWiki search could not be completed. Check your connection and permissions, then try again.
        </div>
      )}
      {status === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
          <Search className="h-8 w-8 text-muted-foreground/30" />
          <p>Enter a query to search this PandaWiki knowledge base.</p>
        </div>
      )}
      {status === "ready" && results.length === 0 && (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
          No matching PandaWiki nodes were found.
        </div>
      )}
      {status === "ready" && results.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 text-xs text-muted-foreground">{results.length} result{results.length === 1 ? "" : "s"}</div>
          <div className="flex flex-col gap-2">
            {results.map((result) => (
              <button
                key={result.nodeId}
                type="button"
                onClick={() => void openResult(result)}
                className="w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent"
              >
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{result.emoji} {result.title}</div>
                    {result.pathNames.length > 0 && (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{result.pathNames.join(" / ")}</div>
                    )}
                    {result.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{result.summary}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
