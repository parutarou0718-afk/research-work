import { useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Network } from "lucide-react"
import { buildRemoteKnowledgeNavigation } from "@/lib/remote-knowledge-navigation"
import { useWikiStore } from "@/stores/wiki-store"
import type { KnowledgeGraphModel } from "@/types/wiki"
import type { GraphProvider } from "@/services/providers/contracts/GraphProvider"
import { isPandaWikiProject } from "@/domain/projects"

interface PandaWikiKnowledgeNavigationProps {
  graphProvider?: GraphProvider
}

/**
 * A read-only Knowledge rail backed only by PandaWiki's permission-filtered
 * graph projection. Labels and group membership come from the server schema.
 */
export function PandaWikiKnowledgeNavigation({ graphProvider }: PandaWikiKnowledgeNavigationProps) {
  const project = useWikiStore((state) => state.activeProject)
  const setActiveView = useWikiStore((state) => state.setActiveView)
  const [graph, setGraph] = useState<KnowledgeGraphModel | null>(null)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!graphProvider || !isPandaWikiProject(project)) return
    let cancelled = false
    void graphProvider.getGraph(project.knowledgeBaseId)
      .then((nextGraph) => {
        if (!cancelled) {
          setGraph(nextGraph)
          setOpenSections(Object.fromEntries(nextGraph.schema.navigation.map((section) => [section.id, true])))
        }
      })
      .catch(() => {
        if (!cancelled) setGraph(null)
      })
    return () => { cancelled = true }
  }, [graphProvider, project])

  if (!graphProvider || !isPandaWikiProject(project)) return null
  if (!graph) return <p className="px-3 py-2 text-xs text-muted-foreground">Knowledge categories appear after the server graph is available.</p>

  const sections = buildRemoteKnowledgeNavigation(graph)
  if (sections.length === 0) return <p className="px-3 py-2 text-xs text-muted-foreground">This knowledge base has no configured knowledge categories yet.</p>

  return (
    <div className="border-t py-1">
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
        <Network className="h-3.5 w-3.5" /> Knowledge
      </div>
      {sections.map((section) => {
        const expanded = openSections[section.id] ?? true
        return (
          <div key={section.id}>
            <button
              type="button"
              className="flex w-full items-center gap-1 px-3 py-1 text-left text-sm font-medium hover:bg-accent"
              onClick={() => setOpenSections((current) => ({ ...current, [section.id]: !expanded }))}
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              <span>{section.label}</span>
              <span className="ml-auto text-xs font-normal text-muted-foreground">{section.entities.length}</span>
            </button>
            {expanded && section.entities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                className="block w-full truncate px-7 py-1 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                title={entity.name}
                onClick={() => setActiveView("graph")}
              >
                {entity.name}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
