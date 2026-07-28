export interface ProjectCapabilities {
  readKnowledge: boolean
  search: boolean
  chat: boolean
  editNode: boolean
  upload: boolean
  conversationHistory: boolean
  graph: boolean
  filesystem: boolean
}

export const LOCAL_PROJECT_CAPABILITIES: ProjectCapabilities = {
  readKnowledge: true,
  search: true,
  chat: true,
  editNode: true,
  upload: true,
  conversationHistory: true,
  graph: true,
  filesystem: true,
}

export interface LocalProject {
  id: string
  source: "local"
  name: string
  path: string
  capabilities: ProjectCapabilities
}

export type ProviderScopeKey = `${string}:${string}`

export interface PandaWikiVirtualProject {
  id: `pandawiki:${string}:${string}`
  source: "pandawiki"
  name: string
  connectionId: string
  knowledgeBaseId: string
  scopeKey: ProviderScopeKey
  capabilities: ProjectCapabilities
}

export type Project = LocalProject | PandaWikiVirtualProject
export type WikiProject = Project

export class UnsupportedProjectOperationError extends Error {
  constructor(readonly operation: string, readonly source: Project["source"]) {
    super(`${operation} is unavailable for ${source} projects.`)
    this.name = "UnsupportedProjectOperationError"
  }
}

export function buildPandaWikiProjectId(
  connectionId: string,
  knowledgeBaseId: string,
): `pandawiki:${string}:${string}` {
  return `pandawiki:${connectionId}:${knowledgeBaseId}`
}

export function buildProviderScopeKey(
  connectionId: string,
  knowledgeBaseId: string,
): ProviderScopeKey {
  return `${connectionId}:${knowledgeBaseId}`
}

export function createLocalProject(id: string, name: string, path: string): LocalProject {
  return {
    id,
    source: "local",
    name,
    path,
    capabilities: { ...LOCAL_PROJECT_CAPABILITIES },
  }
}

export function isLocalProject(project: Project | null): project is LocalProject {
  return project?.source === "local"
}

export function isPandaWikiProject(project: Project | null): project is PandaWikiVirtualProject {
  return project?.source === "pandawiki"
}

export function requireLocalProject(project: Project, operation: string): LocalProject {
  if (!isLocalProject(project)) {
    throw new UnsupportedProjectOperationError(operation, project.source)
  }
  return project
}
