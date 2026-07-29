import { BookOpen, MessageSquare, Puzzle, Search, Settings } from "lucide-react"
import type { PandaWikiVirtualProject } from "@/domain/projects"
import type { RemoteShellView } from "@/lib/project-capabilities"

interface RemoteProjectHomeProps {
  project: PandaWikiVirtualProject
  onNavigate: (view: RemoteShellView) => void
}

/** The entry point for a remote project; no local path is ever assumed here. */
export function RemoteProjectHome({ project, onNavigate }: RemoteProjectHomeProps) {
  const actions: Array<{
    view: RemoteShellView
    title: string
    description: string
    icon: typeof BookOpen
  }> = [
    {
      view: "wiki",
      title: "Browse knowledge",
      description: "Open the PandaWiki knowledge tree and read remote nodes.",
      icon: BookOpen,
    },
    {
      view: "search",
      title: "Search knowledge",
      description: "Search server-side with your PandaWiki permissions.",
      icon: Search,
    },
    {
      view: "chat",
      title: "Ask knowledge base",
      description: "Ask the selected knowledge base through its configured chat API.",
      icon: MessageSquare,
    },
    {
      view: "plugin",
      title: "Workspace plugins",
      description: "Use enabled workspace plugins with data isolated to this knowledge base.",
      icon: Puzzle,
    },
    {
      view: "settings",
      title: "PandaWiki settings",
      description: "Review connection and chat settings without exposing credentials.",
      icon: Settings,
    },
  ]

  return (
    <main className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-semibold">{project.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">PandaWiki remote knowledge workspace</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            This workspace uses PandaWiki for knowledge, search, and permissions. Local-only file tools stay separate from this remote knowledge base.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map(({ view, title, description, icon: Icon }) => (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate(view)}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <span>
                <span className="block font-medium">{title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
