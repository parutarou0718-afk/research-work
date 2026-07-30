import type { Project, ProjectCapabilities } from "@/domain/projects"

export type WorkspaceSuiteId = "research" | "legal" | "investment"
export type WorkspaceSurface = "overview" | "entities" | "timeline" | "board"
export type WorkspaceTargetView = "wiki" | "sources" | "search" | "graph" | "chat"

export interface WorkspaceMenuItem {
  id: string
  label: string
  description: string
  surface?: WorkspaceSurface
  targetView?: WorkspaceTargetView
  route?: "plugin:official.submission-management"
  requires?: keyof ProjectCapabilities
}

export interface WorkspaceSuite {
  id: WorkspaceSuiteId
  name: string
  description: string
  menu: WorkspaceMenuItem[]
}

export const WORKSPACE_SUITES: WorkspaceSuite[] = [
  {
    id: "research",
    name: "Research Workspace",
    description: "Literature, research knowledge, analysis, and submissions.",
    menu: [
      { id: "overview", label: "Overview", description: "Research workspace overview.", surface: "overview" },
      { id: "documents", label: "Documents", description: "Browse server or local research materials.", targetView: "sources", requires: "upload" },
      { id: "search", label: "Search", description: "Search the active knowledge base.", targetView: "search", requires: "search" },
      { id: "graph", label: "Literature graph", description: "Explore server-generated research relationships.", targetView: "graph", requires: "graph" },
      { id: "chat", label: "Research chat", description: "Ask questions over the active knowledge base.", targetView: "chat", requires: "chat" },
      { id: "submissions", label: "Submission management", description: "Track papers and submission status.", route: "plugin:official.submission-management" },
    ],
  },
  {
    id: "legal",
    name: "Legal Workspace",
    description: "Matters, evidence, legal research, and knowledge relationships.",
    menu: [
      { id: "overview", label: "Overview", description: "Legal workspace overview.", surface: "overview" },
      { id: "matters", label: "Matters", description: "Server-extracted matters and documents.", surface: "entities", requires: "graph" },
      { id: "timeline", label: "Evidence timeline", description: "Dated facts from the server knowledge graph.", surface: "timeline", requires: "graph" },
      { id: "search", label: "Legal research", description: "Search authorized legal knowledge.", targetView: "search", requires: "search" },
      { id: "graph", label: "Knowledge graph", description: "Explore server-generated legal relationships.", targetView: "graph", requires: "graph" },
      { id: "chat", label: "Ask the knowledge base", description: "Ask questions over authorized materials.", targetView: "chat", requires: "chat" },
    ],
  },
  {
    id: "investment",
    name: "Investment Research Workspace",
    description: "Companies, risks, market knowledge, and analysis.",
    menu: [
      { id: "overview", label: "Overview", description: "Investment research workspace overview.", surface: "overview" },
      { id: "companies", label: "Companies", description: "Server-extracted organizations and people.", surface: "entities", requires: "graph" },
      { id: "risks", label: "Risk board", description: "Risk attributes from the server knowledge graph.", surface: "board", requires: "graph" },
      { id: "search", label: "Research search", description: "Search authorized company and industry knowledge.", targetView: "search", requires: "search" },
      { id: "graph", label: "Knowledge graph", description: "Explore server-generated company relationships.", targetView: "graph", requires: "graph" },
      { id: "chat", label: "Analysis chat", description: "Ask questions over the active knowledge base.", targetView: "chat", requires: "chat" },
    ],
  },
]

export function getVisibleSuiteMenuItems(suite: WorkspaceSuite, project: Project | null): WorkspaceMenuItem[] {
  return suite.menu.filter((item) => !item.requires || Boolean(project?.capabilities[item.requires]))
}
