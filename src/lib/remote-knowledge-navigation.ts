import type { EntityModel, KnowledgeGraphModel } from "@/types/wiki"

export interface RemoteKnowledgeNavigationSection {
  id: string
  label: string
  entities: EntityModel[]
}

export type RemoteKnowledgeIcon = "overview" | "entity" | "concept" | "source" | "idea" | "other"

export interface RemoteKnowledgeNavigationDisplaySection extends RemoteKnowledgeNavigationSection {
  count: number
  icon: RemoteKnowledgeIcon
  colorClass: string
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

/**
 * Presentation is derived from the server-approved section membership, never
 * from translated section labels. Labels and ordering therefore remain fully
 * configurable in PandaWiki's Knowledge Model settings.
 */
export function buildRemoteKnowledgeNavigationDisplay(graph: KnowledgeGraphModel): RemoteKnowledgeNavigationDisplaySection[] {
  return buildRemoteKnowledgeNavigation(graph).map((section) => ({
    ...section,
    count: section.entities.length,
    ...styleForEntityTypes(graph.schema.navigation.find((item) => item.id === section.id)?.entityTypes ?? []),
  }))
}

function styleForEntityTypes(entityTypes: string[]): Pick<RemoteKnowledgeNavigationDisplaySection, "icon" | "colorClass"> {
  if (entityTypes.includes("document")) return { icon: "overview", colorClass: "text-yellow-500" }
  if (entityTypes.includes("person") || entityTypes.includes("organization")) return { icon: "entity", colorClass: "text-blue-500" }
  if (entityTypes.includes("concept") || entityTypes.includes("method")) return { icon: "concept", colorClass: "text-purple-500" }
  if (entityTypes.includes("event")) return { icon: "source", colorClass: "text-orange-500" }
  return { icon: "other", colorClass: "text-muted-foreground" }
}
