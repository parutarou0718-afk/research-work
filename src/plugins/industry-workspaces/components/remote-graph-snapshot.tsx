import { useEffect, useState } from "react"
import { AlertCircle, CalendarDays, Landmark, ShieldAlert } from "lucide-react"
import type { PluginProject } from "@/core/plugins/host/types"
import type { GraphProvider } from "@/services/providers/contracts/GraphProvider"
import type { EntityModel, KnowledgeGraphModel } from "@/types/wiki"
import { buildAttributeBoard, buildAttributeTimeline, filterEntitiesByTypes } from "../domain/graph-projections"

export type RemoteGraphSnapshotMode = "legal-matters" | "legal-timeline" | "investment-companies" | "investment-risks"

interface RemoteGraphSnapshotProps {
  graphProvider?: GraphProvider
  project: PluginProject | null
  mode: RemoteGraphSnapshotMode
}

export function RemoteGraphSnapshot({ graphProvider, project, mode }: RemoteGraphSnapshotProps) {
  const [graph, setGraph] = useState<KnowledgeGraphModel | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    if (!graphProvider || project?.source !== "pandawiki" || !project.knowledgeBaseId) {
      setGraph(null)
      setStatus("ready")
      return
    }
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
        if (!cancelled) {
          setGraph(null)
          setStatus("error")
        }
      })
    return () => { cancelled = true }
  }, [graphProvider, project])

  if (project?.source !== "pandawiki" || !project.knowledgeBaseId) return <SnapshotState message="This read-only server view is available after selecting a PandaWiki knowledge base." />
  if (!graphProvider) return <SnapshotState message="The PandaWiki graph connection is unavailable for this workspace." />
  if (status === "loading") return <SnapshotState message="Loading server knowledge facts…" />
  if (status === "error" || !graph) return <SnapshotState message="PandaWiki could not load knowledge facts for this workspace." error />
  return <RemoteGraphSnapshotContent graph={graph} mode={mode} />
}

export function RemoteGraphSnapshotContent({ graph, mode }: { graph: KnowledgeGraphModel; mode: RemoteGraphSnapshotMode }) {
  if (mode === "legal-matters") {
    return <EntityList title="Matters" description="Server-extracted events and documents visible to you." entities={filterEntitiesByTypes(graph, ["event", "document"])} emptyMessage="No server matter facts are available yet. Configure the knowledge schema and rebuild the graph." />
  }
  if (mode === "legal-timeline") {
    const timeline = buildTimelineFromKnownFields(graph, ["event_date", "date", "occurred_at"])
    return (
      <section className="mt-6">
        <SectionHeading icon={CalendarDays} title="Evidence timeline" description="Dated facts returned by PandaWiki’s permission-filtered graph." />
        {timeline.length === 0 ? <EmptyData message="No dated facts are available yet. Add an enabled date field such as event_date in the server knowledge schema, then rebuild the graph." /> : (
          <ol className="space-y-3 border-l pl-5">
            {timeline.map((row) => <li key={`${row.entity.id}:${row.value}`} className="relative"><span className="absolute -left-[1.7rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" /><p className="text-xs text-muted-foreground">{row.value}</p><p className="font-medium">{row.entity.name}</p><p className="text-xs text-muted-foreground">{row.entity.type}</p></li>)}
          </ol>
        )}
      </section>
    )
  }
  if (mode === "investment-companies") {
    return <EntityList title="Companies and people" description="Server-extracted organizations and people visible to you." entities={filterEntitiesByTypes(graph, ["organization", "person"])} emptyMessage="No company facts are available yet. Configure entity extraction in the server knowledge schema and rebuild the graph." />
  }
  const board = buildBoardFromKnownFields(graph, ["risk_level", "risk"])
  return (
    <section className="mt-6">
      <SectionHeading icon={ShieldAlert} title="Risk board" description="Risk facts are grouped only from server-defined graph attributes." />
      {board.size === 0 ? <EmptyData message="No server risk facts are available yet. Add an enabled select or text field such as risk_level in the server knowledge schema, then rebuild the graph." /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...board.entries()].map(([bucket, entities]) => <article key={bucket} className="rounded-lg border bg-muted/20 p-3"><h3 className="font-medium capitalize">{bucket}</h3><ul className="mt-2 space-y-1">{entities.map((entity) => <li key={entity.id} className="rounded bg-background px-2 py-1 text-sm">{entity.name}</li>)}</ul></article>)}
        </div>
      )}
    </section>
  )
}

function buildTimelineFromKnownFields(graph: KnowledgeGraphModel, keys: string[]) {
  for (const key of keys) {
    const rows = buildAttributeTimeline(graph, key)
    if (rows.length > 0) return rows
  }
  return []
}

function buildBoardFromKnownFields(graph: KnowledgeGraphModel, keys: string[]) {
  for (const key of keys) {
    const board = buildAttributeBoard(graph, key)
    if (board.size > 0) return board
  }
  return new Map<string, EntityModel[]>()
}

function EntityList({ title, description, entities, emptyMessage }: { title: string; description: string; entities: EntityModel[]; emptyMessage: string }) {
  return (
    <section className="mt-6">
      <SectionHeading icon={Landmark} title={title} description={description} />
      {entities.length === 0 ? <EmptyData message={emptyMessage} /> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{entities.map((entity) => <article key={entity.id} className="rounded-lg border p-3"><p className="font-medium">{entity.name}</p><p className="mt-1 text-xs text-muted-foreground">{entity.type}</p></article>)}</div>}
    </section>
  )
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Landmark; title: string; description: string }) {
  return <header className="mb-3"><h2 className="flex items-center gap-2 text-base font-semibold"><Icon className="h-4 w-4" /> {title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></header>
}

function EmptyData({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{message}</div>
}

function SnapshotState({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={`mt-6 flex items-start gap-2 rounded-lg border p-4 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>
}
