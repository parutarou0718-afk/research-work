import { BookOpen, LoaderCircle } from "lucide-react"
import type { PandaWikiVirtualProject } from "@/domain/projects"

interface PandaWikiProjectListProps {
  projects: PandaWikiVirtualProject[]
  loading: boolean
  error: string | null
  onSelectProject(project: PandaWikiVirtualProject): void
}

export function PandaWikiProjectList({
  projects,
  loading,
  error,
  onSelectProject,
}: PandaWikiProjectListProps) {
  return (
    <section className="w-full max-w-md" aria-label="PandaWiki knowledge bases">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        PandaWiki knowledge bases
      </div>
      {loading && (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading knowledge bases…
        </div>
      )}
      {!loading && error && (
        <p className="rounded-lg border border-destructive/40 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && projects.length === 0 && (
        <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          No knowledge bases are available for this account.
        </p>
      )}
      {!loading && !error && projects.length > 0 && (
        <div className="rounded-lg border">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project)}
              className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent"
            >
              <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{project.name}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
