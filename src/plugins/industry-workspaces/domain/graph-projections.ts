import type { EntityModel, KnowledgeGraphModel } from "@/types/wiki"

export interface TimelineRow {
  entity: EntityModel
  value: string
  timestamp: number
}

function attributeStrings(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values.flatMap((candidate) => {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim()
      return trimmed ? [trimmed] : []
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) return [String(candidate)]
    if (typeof candidate === "boolean") return [String(candidate)]
    return []
  })
}

export function filterEntitiesByTypes(graph: KnowledgeGraphModel, types: string[]): EntityModel[] {
  return graph.entities.filter((entity) => types.includes(entity.type))
}

export function buildAttributeTimeline(graph: KnowledgeGraphModel, attributeKey: string): TimelineRow[] {
  return graph.entities.flatMap((entity) => attributeStrings(entity.attributes[attributeKey])
    .map((value) => ({ entity, value, timestamp: Date.parse(value) }))
    .filter((row) => Number.isFinite(row.timestamp)))
    .sort((left, right) => left.timestamp - right.timestamp || left.entity.name.localeCompare(right.entity.name))
}

export function buildAttributeBoard(graph: KnowledgeGraphModel, attributeKey: string): Map<string, EntityModel[]> {
  const buckets = new Map<string, EntityModel[]>()
  graph.entities.forEach((entity) => {
    attributeStrings(entity.attributes[attributeKey]).forEach((value) => {
      const entities = buckets.get(value) ?? []
      if (!entities.some((current) => current.id === entity.id)) entities.push(entity)
      buckets.set(value, entities)
    })
  })
  return new Map([...buckets.entries()].sort(([left], [right]) => left.localeCompare(right)))
}
