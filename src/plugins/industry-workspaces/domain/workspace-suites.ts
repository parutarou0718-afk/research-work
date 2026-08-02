import type { ProjectCapabilities } from "@/domain/projects"

export type WorkspaceSuiteId = "research" | "legal" | "investment" | "business"
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
      { id: "projects", label: "Research projects", description: "Track research goals, milestones, and related materials.", surface: "entities" },
      { id: "submissions", label: "Submission management", description: "Track papers and submission status.", route: "plugin:official.submission-management" },
      { id: "literature", label: "Literature and authors", description: "Record literature, authors, and reading notes.", surface: "entities" },
      { id: "timeline", label: "Research timeline", description: "Organize research milestones by date.", surface: "timeline" },
      { id: "report", label: "Literature review report", description: "Draft and export a structured research report.", surface: "board" },
      { id: "documents", label: "Documents", description: "Browse server or local research materials.", targetView: "sources", requires: "upload" },
      { id: "search", label: "Search", description: "Search the active knowledge base.", targetView: "search", requires: "search" },
      { id: "graph", label: "Literature graph", description: "Explore server-generated research relationships.", targetView: "graph", requires: "graph" },
      { id: "chat", label: "Research chat", description: "Ask questions over the active knowledge base.", targetView: "chat", requires: "chat" },
    ],
  },
  {
    id: "legal",
    name: "Legal Workspace",
    description: "Matters, evidence, legal research, and knowledge relationships.",
    menu: [
      { id: "overview", label: "Overview", description: "Legal workspace overview.", surface: "overview" },
      { id: "matters", label: "Matters", description: "Track matters, parties, and key documents.", surface: "entities" },
      { id: "contracts", label: "Contract review", description: "Record review issues, clauses, and recommendations.", surface: "board" },
      { id: "timeline", label: "Evidence timeline", description: "Organize dated evidence and events.", surface: "timeline" },
      { id: "opinion", label: "Legal opinion report", description: "Draft and export a structured legal opinion.", surface: "board" },
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
      { id: "companies", label: "Companies and entities", description: "Track companies, industries, and key contacts.", surface: "entities" },
      { id: "diligence", label: "Diligence items", description: "Manage investigation tasks and evidence.", surface: "entities" },
      { id: "risks", label: "Risk matrix", description: "Record risks, ratings, owners, and mitigations.", surface: "board" },
      { id: "report", label: "Investment research report", description: "Draft and export a company or industry report.", surface: "board" },
      { id: "search", label: "Research search", description: "Search authorized company and industry knowledge.", targetView: "search", requires: "search" },
      { id: "graph", label: "Knowledge graph", description: "Explore server-generated company relationships.", targetView: "graph", requires: "graph" },
      { id: "chat", label: "Analysis chat", description: "Ask questions over the active knowledge base.", targetView: "chat", requires: "chat" },
    ],
  },
  {
    id: "business",
    name: "Business Workspace",
    description: "Customers, sales follow-up, enterprise knowledge, and client projects.",
    menu: [
      { id: "overview", label: "Overview", description: "Business workspace overview.", surface: "overview" },
      { id: "customers", label: "Customers and projects", description: "Organize customers, contacts, and client projects.", surface: "entities" },
      { id: "followups", label: "Sales follow-up", description: "Track opportunities, next actions, and outcomes.", surface: "timeline" },
      { id: "knowledge", label: "Enterprise knowledge", description: "Capture reusable customer and business knowledge.", surface: "entities" },
      { id: "report", label: "Business report", description: "Draft and export a customer or sales report.", surface: "board" },
      { id: "documents", label: "Documents", description: "Browse authorized source materials.", targetView: "sources", requires: "upload" },
      { id: "search", label: "Search", description: "Search active business knowledge.", targetView: "search", requires: "search" },
      { id: "graph", label: "Relationship graph", description: "Explore available knowledge relationships.", targetView: "graph", requires: "graph" },
      { id: "chat", label: "Knowledge chat", description: "Ask questions over the active knowledge base.", targetView: "chat", requires: "chat" },
    ],
  },
]

export function getVisibleSuiteMenuItems(suite: WorkspaceSuite, project: { source: "local" | "pandawiki"; capabilities?: ProjectCapabilities } | null): WorkspaceMenuItem[] {
  return suite.menu.filter((item) => !item.requires || project?.source === "local" || Boolean(project?.capabilities?.[item.requires]))
}
