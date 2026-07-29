import { useEffect, useState } from "react"
import type { KnowledgeGraphModel } from "@/types/wiki"
import { useWikiStore } from "@/stores/wiki-store"
import type { GraphProvider } from "@/services/providers/contracts/GraphProvider"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import { isPandaWikiProject } from "@/domain/projects"

interface PandaWikiGraphViewProps {
  graphProvider?: GraphProvider
  knowledgeProvider?: KnowledgeProvider
}

/**
 * Remote graph surface. It renders only the server's permission-filtered
 * projection; neither source documents nor local graph builders are used.
 */
export function PandaWikiGraphView({ graphProvider, knowledgeProvider }: PandaWikiGraphViewProps) {
  const project = useWikiStore((state) => state.activeProject)
  const [graph, setGraph] = useState<KnowledgeGraphModel | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    if (!graphProvider || !isPandaWikiProject(project)) return
    let cancelled = false
    setStatus("loading")
    void graphProvider.getGraph(project.knowledgeBaseId)
      .then((nextGraph) => {
        if (!cancelled) {
          setGraph(nextGraph)
          setStatus("ready")
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })
    return () => { cancelled = true }
  }, [graphProvider, project])

  if (!graphProvider || !knowledgeProvider || !isPandaWikiProject(project)) {
    return <RemoteGraphState message="Knowledge graph is unavailable for this project." />
  }
  if (status === "loading") return <RemoteGraphState message="Loading PandaWiki knowledge graph…" />
  if (status === "error") return <RemoteGraphState message="PandaWiki could not load this knowledge graph." error />
  if (!graph || graph.relations.length === 0) {
    return <RemoteGraphState message="No visible graph relations yet. Update or publish a server document to queue graph extraction." />
  }

  const entities = new Map(graph.entities.map((entity) => [entity.id, entity]))
  const openEvidence = async (nodeId: string) => {
    await useWikiStore.getState().selectProviderNode(knowledgeProvider, nodeId)
    useWikiStore.getState().setActiveView("wiki")
  }

  return (
    <section className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Knowledge graph</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Server-generated relationships. Only sources you can access are shown.
          </p>
        </header>
        <div className="grid gap-3">
          {graph.relations.map((relation) => {
            const source = entities.get(relation.sourceId)?.name ?? "Unknown entity"
            const target = entities.get(relation.targetId)?.name ?? "Unknown entity"
            return (
              <article key={relation.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <strong>{source}</strong>
                  <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{relation.type}</span>
                  <strong>{target}</strong>
                </div>
                {relation.evidence.map((evidence) => (
                  <div key={`${relation.id}:${evidence.nodeId}`} className="mt-3 border-l-2 pl-3 text-sm text-muted-foreground">
                    {evidence.excerpt && <p className="whitespace-pre-wrap">{evidence.excerpt}</p>}
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-primary hover:underline"
                      onClick={() => { void openEvidence(evidence.nodeId) }}
                    >
                      Open source document
                    </button>
                  </div>
                ))}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function RemoteGraphState({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={`flex h-full items-center justify-center px-6 text-center text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
      {message}
    </div>
  )
}
