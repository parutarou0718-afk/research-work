import type { KnowledgeGraphModel } from "@/types/wiki"

export interface RemoteGraphDisplayNode {
  id: string
  label: string
  type: string
  color: string
}

export interface RemoteGraphDisplayEdge {
  id: string
  sourceId: string
  targetId: string
  type: string
}

export interface RemoteGraphDisplay {
  nodes: RemoteGraphDisplayNode[]
  edges: RemoteGraphDisplayEdge[]
}

export interface RemoteGraphFilterState {
  query: string
  types: ReadonlySet<string>
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

export function buildRemoteGraphDisplay(graph: KnowledgeGraphModel): RemoteGraphDisplay {
  return {
    nodes: graph.entities.map((entity) => ({
      id: entity.id,
      label: entity.name,
      type: entity.type,
      color: ENTITY_COLORS[entity.type] ?? ENTITY_COLORS.other,
    })),
    edges: graph.relations.map((relation) => ({
      id: relation.id,
      sourceId: relation.sourceId,
      targetId: relation.targetId,
      type: relation.type,
    })),
  }
}

export function applyRemoteGraphFilters(graph: RemoteGraphDisplay, filters: RemoteGraphFilterState): RemoteGraphDisplay {
  const query = filters.query.trim().toLocaleLowerCase()
  const nodes = graph.nodes.filter((node) =>
    (filters.types.size === 0 || filters.types.has(node.type)) &&
    (!query || node.label.toLocaleLowerCase().includes(query)),
  )
  const visibleIds = new Set(nodes.map((node) => node.id))
  return {
    nodes,
    edges: graph.edges.filter((edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId)),
  }
}

export function remoteGraphEntityTypes(graph: RemoteGraphDisplay): string[] {
  return [...new Set(graph.nodes.map((node) => node.type))].sort((left, right) => left.localeCompare(right))
}
