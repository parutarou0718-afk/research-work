import type { EntityModel, KnowledgeGraphModel } from "@/types/wiki"

export interface RemoteKnowledgeNavigationSection {
  id: string
  label: string
  entities: EntityModel[]
}

/**
 * The server owns the navigation schema. This helper deliberately does not
 * infer categories from labels or maintain a client-side entity taxonomy.
 */
export function buildRemoteKnowledgeNavigation(graph: KnowledgeGraphModel): RemoteKnowledgeNavigationSection[] {
  return graph.schema.navigation
    .filter((section) => section.enabled)
    .sort((left, right) => left.order - right.order)
    .map((section) => ({
      id: section.id,
      label: section.label,
      entities: graph.entities.filter((entity) => section.entityTypes.includes(entity.type)),
    }))
}
