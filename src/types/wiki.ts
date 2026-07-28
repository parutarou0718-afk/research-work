/**
 * Compatibility shape used by existing local-only file APIs. New workspace
 * code uses the discriminated Project union from @/domain/projects instead.
 */
export interface WikiProject {
  id: string
  name: string
  path: string
}

export type {
  LocalProject,
  PandaWikiVirtualProject,
  Project,
  ProjectCapabilities,
  ProviderScopeKey,
} from "@/domain/projects"

export interface FileNode {
  name: string
  path: string
  is_dir: boolean
  children?: FileNode[]
}

export interface WikiPage {
  path: string
  content: string
  frontmatter: Record<string, unknown>
}

export type ProviderType = "pandawiki" | "local" | "mock"

export interface ProviderConfig {
  id: string
  type: ProviderType
  label: string
}

export interface KnowledgeModel {
  id: string
  name: string
  datasetId: string
  createdAt: string
  updatedAt: string
}

export interface NodeModel {
  id: string
  knowledgeBaseId: string
  name: string
  content: string
  parentId: string | null
  navId?: string
  type: string
  status: string
  summary?: string
  emoji?: string
  updatedAt: string
}

export interface FileTreeNode {
  id: string
  name: string
  parentId: string | null
  nodeType: string
  status: string
  children: FileTreeNode[]
}

export interface FileTreeModel {
  knowledgeBaseId: string
  roots: FileTreeNode[]
}

export type DocumentStatus = "pending" | "processing" | "ready" | "failed"

export interface DocumentModel {
  id: string
  knowledgeBaseId: string
  name: string
  status: DocumentStatus
  updatedAt: string
}

export interface ConversationModel {
  id: string
  knowledgeBaseId: string
  title: string
  updatedAt: string
}

export interface ConversationChunk {
  conversationId: string
  content: string
  done: boolean
}

export interface MessageInput {
  content: string
  knowledgeBaseId: string
  conversationId?: string
}

export interface SearchResult {
  id: string
  nodeId: string
  title: string
  excerpt: string
}

export interface EntityModel {
  id: string
  name: string
  type: string
}

export interface RelationModel {
  id: string
  sourceId: string
  targetId: string
  type: string
}

export interface TemplateConfig {
  id: string
  name: string
  description: string
}

export interface LoginInput {
  serverUrl: string
  account: string
  password: string
}

export interface AuthSession {
  accessToken: string
  user: {
    id: string
    account: string
    role: string
  }
}

export interface UploadInput {
  knowledgeBaseId: string
  file: File
}
