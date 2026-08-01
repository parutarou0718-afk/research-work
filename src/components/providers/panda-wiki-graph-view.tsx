import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Graph from "graphology"
import forceAtlas2 from "graphology-layout-forceatlas2"
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from "@react-sigma/core"
import "@react-sigma/core/lib/style.css"
import { Filter, Maximize, Network, RefreshCw, RotateCcw, Search, ZoomIn, ZoomOut } from "lucide-react"
import type { KnowledgeGraphModel } from "@/types/wiki"
import { useWikiStore } from "@/stores/wiki-store"
import { usePandaWikiWorkspaceStore } from "@/stores/pandawiki-workspace-store"
import type { GraphProvider } from "@/services/providers/contracts/GraphProvider"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import { isPandaWikiProject } from "@/domain/projects"
import { applyRemoteGraphFilters, buildRemoteGraphDisplay, remoteGraphEntityTypes, type RemoteGraphDisplay } from "@/lib/remote-graph-display"
import { PandaWikiGraphEntityDetails } from "./panda-wiki-graph-entity-details"

interface PandaWikiGraphViewProps {
  graphProvider?: GraphProvider
  knowledgeProvider?: KnowledgeProvider
}

/**
 * Remote-only graph surface. It consumes the permission-filtered server graph
 * and never imports filesystem, local graph-builder, or source-index modules.
 */
export function PandaWikiGraphView({ graphProvider, knowledgeProvider }: PandaWikiGraphViewProps) {
  const project = useWikiStore((state) => state.activeProject)
  const selectedEntityId = usePandaWikiWorkspaceStore((state) => state.selectedGraphEntityId)
  const setSelectedGraphEntity = usePandaWikiWorkspaceStore((state) => state.setSelectedGraphEntity)
  const [graph, setGraph] = useState<KnowledgeGraphModel | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [query, setQuery] = useState("")
  const [types, setTypes] = useState<Set<string>>(new Set())
  const requestVersion = useRef(0)

  const refresh = useCallback(() => {
    if (!graphProvider || !isPandaWikiProject(project)) return
    const version = ++requestVersion.current
    setStatus("loading")
    void graphProvider.getGraph(project.knowledgeBaseId)
      .then((nextGraph) => {
        if (version !== requestVersion.current) return
        setGraph(nextGraph)
        setStatus("ready")
      })
      .catch(() => {
        if (version === requestVersion.current) setStatus("error")
      })
  }, [graphProvider, project])

  useEffect(() => { refresh() }, [refresh])

  if (!graphProvider || !knowledgeProvider || !isPandaWikiProject(project)) {
    return <RemoteGraphState message="当前项目不支持服务器知识图谱。" />
  }
  if (status === "loading") return <RemoteGraphState message="正在加载服务器知识图谱…" />
  if (status === "error") return <RemoteGraphState message="无法加载服务器知识图谱。请检查连接与权限后重试。" error />
  if (!graph || graph.entities.length === 0) {
    return <RemoteGraphState message="暂时没有可见的知识事实。请先在服务器发布文档并重建图谱。" />
  }

  const display = buildRemoteGraphDisplay(graph)
  const availableTypes = remoteGraphEntityTypes(display)
  const visible = applyRemoteGraphFilters(display, { query, types })
  const selectedEntity = graph.entities.find((entity) => entity.id === selectedEntityId) ?? null

  const openEvidence = async (nodeId: string) => {
    await useWikiStore.getState().selectProviderNode(knowledgeProvider, nodeId)
    useWikiStore.getState().setActiveView("wiki")
  }
  const toggleType = (type: string) => {
    setTypes((current) => {
      const next = new Set(current)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }
  const reset = () => {
    setQuery("")
    setTypes(new Set())
    setSelectedGraphEntity(null)
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3">
        <div className="mr-auto flex items-center gap-2">
          <Network className="h-4 w-4" />
          <h1 className="text-base font-semibold">知识图谱</h1>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{visible.nodes.length}/{display.nodes.length} 个节点</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{visible.edges.length}/{display.edges.length} 条关系</span>
        </div>
        <button type="button" className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-accent" onClick={refresh}>
          <RefreshCw className="h-3.5 w-3.5" /> 刷新
        </button>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2">
        <label className="flex min-w-48 flex-1 items-center gap-2 rounded border px-2 py-1.5 text-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input className="min-w-0 flex-1 bg-transparent outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索实体" />
        </label>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" /> 类型</span>
        {availableTypes.map((type) => (
          <button key={type} type="button" onClick={() => toggleType(type)} className={`rounded border px-2 py-1 text-xs ${types.size === 0 || types.has(type) ? "border-primary/40 bg-primary/10" : "text-muted-foreground"}`}>
            {type}
          </button>
        ))}
        <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-accent"><RotateCcw className="h-3.5 w-3.5" /> 重置</button>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="relative min-h-[24rem] border-b lg:border-b-0 lg:border-r">
          <SigmaContainer className="h-full min-h-[24rem]" settings={{ renderLabels: true, labelRenderedSizeThreshold: 8, defaultEdgeColor: "#cbd5e1", defaultNodeColor: "#94a3b8", stagePadding: 30 }}>
            <RemoteGraphLoader graph={visible} selectedEntityId={selectedEntityId} />
            <RemoteGraphEvents onSelect={setSelectedGraphEntity} />
            <RemoteGraphZoomControls />
          </SigmaContainer>
          {visible.nodes.length === 0 && <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">没有符合当前筛选条件的节点。</div>}
          <div className="absolute bottom-3 left-3 rounded border bg-background/95 p-2 text-xs shadow-sm">
            <div className="mb-1 font-medium">节点类型</div>
            {availableTypes.map((type) => <div key={type} className="flex items-center gap-1.5 py-0.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: display.nodes.find((node) => node.type === type)?.color }} />{type}<span className="ml-auto text-muted-foreground">{display.nodes.filter((node) => node.type === type).length}</span></div>)}
          </div>
        </div>
        <aside className="min-h-0 overflow-y-auto p-4">
          {selectedEntity ? <PandaWikiGraphEntityDetails entity={selectedEntity} graph={graph} onOpenEvidence={openEvidence} /> : <div className="text-sm text-muted-foreground">选择一个节点查看它的属性、关系与来源证据。</div>}
        </aside>
      </div>
    </section>
  )
}

function RemoteGraphLoader({ graph: graphDisplay, selectedEntityId }: { graph: RemoteGraphDisplay; selectedEntityId: string | null }) {
  const loadGraph = useLoadGraph()
  const graph = useMemo(() => {
    const next = new Graph()
    const count = Math.max(graphDisplay.nodes.length, 1)
    graphDisplay.nodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / count
      const selected = node.id === selectedEntityId
      next.addNode(node.id, { x: Math.cos(angle), y: Math.sin(angle), size: selected ? 11 : 7, color: node.color, label: node.label, forceLabel: selected })
    })
    graphDisplay.edges.forEach((edge) => {
      if (next.hasNode(edge.sourceId) && next.hasNode(edge.targetId) && !next.hasEdge(edge.sourceId, edge.targetId)) next.addEdge(edge.sourceId, edge.targetId, { label: edge.type, size: 1.2, color: "#cbd5e1" })
    })
    if (next.order > 1 && next.size > 0) forceAtlas2.assign(next, { iterations: Math.min(120, 30 + next.order * 4), settings: { gravity: 1, scalingRatio: 8, strongGravityMode: true } })
    return next
  }, [graphDisplay, selectedEntityId])
  useEffect(() => { loadGraph(graph) }, [graph, loadGraph])
  return null
}

function RemoteGraphEvents({ onSelect }: { onSelect: (id: string) => void }) {
  const registerEvents = useRegisterEvents()
  const sigma = useSigma()
  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => onSelect(node),
      enterNode: () => { sigma.getContainer().style.cursor = "pointer" },
      leaveNode: () => { sigma.getContainer().style.cursor = "default" },
    })
  }, [onSelect, registerEvents, sigma])
  return null
}

function RemoteGraphZoomControls() {
  const sigma = useSigma()
  return <div className="absolute right-3 top-3 flex flex-col gap-1">
    <button type="button" className="rounded border bg-background/90 p-1.5 shadow-sm hover:bg-accent" onClick={() => sigma.getCamera().animatedZoom({ duration: 200 })}><ZoomIn className="h-3.5 w-3.5" /></button>
    <button type="button" className="rounded border bg-background/90 p-1.5 shadow-sm hover:bg-accent" onClick={() => sigma.getCamera().animatedUnzoom({ duration: 200 })}><ZoomOut className="h-3.5 w-3.5" /></button>
    <button type="button" className="rounded border bg-background/90 p-1.5 shadow-sm hover:bg-accent" onClick={() => sigma.getCamera().animatedReset({ duration: 300 })}><Maximize className="h-3.5 w-3.5" /></button>
  </div>
}

function RemoteGraphState({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={`flex h-full items-center justify-center px-6 text-center text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{message}</div>
}
