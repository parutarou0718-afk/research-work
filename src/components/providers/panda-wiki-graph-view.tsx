import { useEffect, useMemo, useState } from "react"
import Graph from "graphology"
import forceAtlas2 from "graphology-layout-forceatlas2"
import { SigmaContainer, useLoadGraph } from "@react-sigma/core"
import "@react-sigma/core/lib/style.css"
import { Network, RefreshCw } from "lucide-react"
import type { EntityModel, KnowledgeGraphModel } from "@/types/wiki"
import { useWikiStore } from "@/stores/wiki-store"
import type { GraphProvider } from "@/services/providers/contracts/GraphProvider"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import { isPandaWikiProject } from "@/domain/projects"

interface PandaWikiGraphViewProps {
  graphProvider?: GraphProvider
  knowledgeProvider?: KnowledgeProvider
}

const ENTITY_COLORS: Record<string, string> = {
  person: "#60a5fa",
  organization: "#34d399",
  concept: "#c084fc",
  method: "#fbbf24",
  event: "#fb923c",
  document: "#f87171",
  other: "#94a3b8",
}

/**
 * Remote-only graph surface. It never imports the local graph builder or
 * filesystem functions: all nodes, relations, attributes and evidence are
 * permission-filtered by PandaWiki before they arrive here.
 */
export function PandaWikiGraphView({ graphProvider, knowledgeProvider }: PandaWikiGraphViewProps) {
  const project = useWikiStore((state) => state.activeProject)
  const [graph, setGraph] = useState<KnowledgeGraphModel | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [selectedEntity, setSelectedEntity] = useState<EntityModel | null>(null)

  const refresh = () => {
    if (!graphProvider || !isPandaWikiProject(project)) return
    setStatus("loading")
    void graphProvider.getGraph(project.knowledgeBaseId)
      .then((nextGraph) => {
        setGraph(nextGraph)
        setStatus("ready")
        setSelectedEntity((current) => nextGraph.entities.find((entity) => entity.id === current?.id) ?? null)
      })
      .catch(() => setStatus("error"))
  }

  useEffect(() => { refresh() }, [graphProvider, project])

  if (!graphProvider || !knowledgeProvider || !isPandaWikiProject(project)) {
    return <RemoteGraphState message="Knowledge graph is unavailable for this project." />
  }
  if (status === "loading") return <RemoteGraphState message="Loading PandaWiki knowledge graph…" />
  if (status === "error") return <RemoteGraphState message="PandaWiki could not load this knowledge graph." error />
  if (!graph || graph.entities.length === 0) {
    return <RemoteGraphState message="No visible knowledge facts yet. Publish a server document, then start a graph rebuild from a document manager account." />
  }

  const openEvidence = async (nodeId: string) => {
    await useWikiStore.getState().selectProviderNode(knowledgeProvider, nodeId)
    useWikiStore.getState().setActiveView("wiki")
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b px-5 py-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold"><Network className="h-4 w-4" /> Knowledge graph</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">Server-generated, permission-filtered relationships.</p>
        </div>
        <button type="button" className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-accent" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-h-[24rem] border-b lg:border-b-0 lg:border-r">
          <SigmaContainer className="h-full min-h-[24rem]" settings={{ renderLabels: true, labelRenderedSizeThreshold: 8, defaultEdgeColor: "#cbd5e1", defaultNodeColor: "#94a3b8" }}>
            <RemoteGraphLoader graphModel={graph} />
          </SigmaContainer>
        </div>
        <aside className="min-h-0 overflow-y-auto p-4">
          <h2 className="mb-3 text-sm font-semibold">Knowledge items</h2>
          <div className="space-y-1">
            {graph.entities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => setSelectedEntity(entity)}
                className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent ${selectedEntity?.id === entity.id ? "bg-accent" : ""}`}
              >
                <span className="block truncate font-medium">{entity.name}</span>
                <span className="text-xs text-muted-foreground">{entity.type}</span>
              </button>
            ))}
          </div>
          {selectedEntity && <EntityDetails entity={selectedEntity} graph={graph} onOpenEvidence={openEvidence} />}
        </aside>
      </div>
    </section>
  )
}

function RemoteGraphLoader({ graphModel }: { graphModel: KnowledgeGraphModel }) {
  const loadGraph = useLoadGraph()
  const graph = useMemo(() => {
    const next = new Graph()
    const entityCount = Math.max(graphModel.entities.length, 1)
    graphModel.entities.forEach((entity, index) => {
      const angle = (Math.PI * 2 * index) / entityCount
      next.addNode(entity.id, {
        x: Math.cos(angle),
        y: Math.sin(angle),
        size: 7,
        color: ENTITY_COLORS[entity.type] ?? ENTITY_COLORS.other,
        label: entity.name,
      })
    })
    graphModel.relations.forEach((relation) => {
      if (next.hasNode(relation.sourceId) && next.hasNode(relation.targetId) && !next.hasEdge(relation.sourceId, relation.targetId)) {
        next.addEdge(relation.sourceId, relation.targetId, { label: relation.type, size: 1.2, color: "#cbd5e1" })
      }
    })
    if (next.order > 1 && next.size > 0) {
      forceAtlas2.assign(next, { iterations: Math.min(120, 30 + next.order * 4), settings: { gravity: 1, scalingRatio: 8, strongGravityMode: true } })
    }
    return next
  }, [graphModel])

  useEffect(() => { loadGraph(graph) }, [graph, loadGraph])
  return null
}

function EntityDetails({ entity, graph, onOpenEvidence }: { entity: EntityModel; graph: KnowledgeGraphModel; onOpenEvidence: (nodeId: string) => Promise<void> }) {
  const related = graph.relations.filter((relation) => relation.sourceId === entity.id || relation.targetId === entity.id)
  return (
    <section className="mt-5 border-t pt-4">
      <h2 className="text-sm font-semibold">{entity.name}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{entity.type}</p>
      {Object.entries(entity.attributes).map(([key, values]) => (
        <div key={key} className="mt-3 text-sm">
          <div className="text-xs font-medium text-muted-foreground">{key}</div>
          <div className="mt-1 whitespace-pre-wrap break-words">{Array.isArray(values) ? values.join(", ") : String(values)}</div>
        </div>
      ))}
      {related.flatMap((relation) => relation.evidence).slice(0, 5).map((evidence) => (
        <button key={`${evidence.nodeId}:${evidence.nodeReleaseId}`} type="button" onClick={() => { void onOpenEvidence(evidence.nodeId) }} className="mt-3 block text-left text-xs text-primary hover:underline">
          Open source: {evidence.excerpt || evidence.nodeId}
        </button>
      ))}
    </section>
  )
}

function RemoteGraphState({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={`flex h-full items-center justify-center px-6 text-center text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{message}</div>
}
