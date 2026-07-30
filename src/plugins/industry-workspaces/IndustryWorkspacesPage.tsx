import { useEffect, useState } from "react"
import { BookOpen, BriefcaseBusiness, ChevronRight, Scale, TrendingUp } from "lucide-react"
import type { PluginPageProps } from "@/core/plugins/host/types"
import { useWikiStore } from "@/stores/wiki-store"
import {
  getVisibleSuiteMenuItems,
  WORKSPACE_SUITES,
  type WorkspaceMenuItem,
  type WorkspaceSuiteId,
} from "./domain/workspace-suites"
import { RemoteGraphSnapshot, type RemoteGraphSnapshotMode } from "./components/remote-graph-snapshot"

const SUITE_ICONS = {
  research: BookOpen,
  legal: Scale,
  investment: TrendingUp,
}

export function IndustryWorkspacesPage({ host, graphProvider }: PluginPageProps) {
  const [suiteId, setSuiteId] = useState<WorkspaceSuiteId>("research")
  const [selectedItemId, setSelectedItemId] = useState("overview")
  const [project, setProject] = useState(host.project.current())
  const suite = WORKSPACE_SUITES.find((candidate) => candidate.id === suiteId) ?? WORKSPACE_SUITES[0]
  const visibleItems = getVisibleSuiteMenuItems(suite, project)
  const selectedItem = visibleItems.find((item) => item.id === selectedItemId) ?? visibleItems[0]

  useEffect(() => host.project.subscribe(() => setProject(host.project.current())), [host])

  function selectSuite(nextSuiteId: WorkspaceSuiteId) {
    setSuiteId(nextSuiteId)
    setSelectedItemId("overview")
  }

  function selectMenuItem(item: WorkspaceMenuItem) {
    setSelectedItemId(item.id)
    if (item.targetView) {
      useWikiStore.getState().setActiveView(item.targetView)
      return
    }
    if (item.route) useWikiStore.getState().setActivePluginRoute(item.route)
  }

  return (
    <section className="flex h-full min-h-0 bg-background">
      <aside className="w-60 shrink-0 border-r bg-muted/20 p-3">
        <div className="mb-3 flex items-center gap-2 px-2 py-2 text-sm font-semibold">
          <BriefcaseBusiness className="h-4 w-4" /> Workspaces
        </div>
        <div className="space-y-1">
          {WORKSPACE_SUITES.map((candidate) => {
            const Icon = SUITE_ICONS[candidate.id]
            const active = candidate.id === suite.id
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => selectSuite(candidate.id)}
                className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <span><span className="block font-medium">{candidate.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{candidate.description}</span></span>
              </button>
            )
          })}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1">
        <aside className="w-52 shrink-0 border-r p-3">
          <h1 className="px-2 text-sm font-semibold">{suite.name}</h1>
          <p className="mb-3 px-2 pt-1 text-xs text-muted-foreground">{project?.name ?? "Choose a project to use workspace data."}</p>
          <div className="space-y-1">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectMenuItem(item)}
                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm ${selectedItem?.id === item.id ? "bg-accent font-medium" : "hover:bg-accent/50"}`}
              >
                {item.label}<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold">{selectedItem?.label ?? suite.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{selectedItem?.description ?? suite.description}</p>
            <WorkspaceContent suiteId={suite.id} selectedItemId={selectedItem?.id ?? "overview"} graphProvider={graphProvider} project={project} suiteName={suite.name} />
          </div>
        </main>
      </div>
    </section>
  )
}

function WorkspaceContent({ suiteId, selectedItemId, graphProvider, project, suiteName }: {
  suiteId: WorkspaceSuiteId
  selectedItemId: string
  graphProvider: PluginPageProps["graphProvider"]
  project: ReturnType<PluginPageProps["host"]["project"]["current"]>
  suiteName: string
}) {
  const mode = getGraphSnapshotMode(suiteId, selectedItemId)
  if (mode) return <RemoteGraphSnapshot graphProvider={graphProvider} project={project} mode={mode} />
  return <WorkspaceOverview suiteName={suiteName} projectName={project?.name ?? null} />
}

function getGraphSnapshotMode(suiteId: WorkspaceSuiteId, itemId: string): RemoteGraphSnapshotMode | null {
  if (suiteId === "legal" && itemId === "matters") return "legal-matters"
  if (suiteId === "legal" && itemId === "timeline") return "legal-timeline"
  if (suiteId === "investment" && itemId === "companies") return "investment-companies"
  if (suiteId === "investment" && itemId === "risks") return "investment-risks"
  return null
}

function WorkspaceOverview({ suiteName, projectName }: { suiteName: string; projectName: string | null }) {
  return (
    <div className="mt-6 rounded-lg border bg-muted/20 p-5 text-sm">
      <p className="font-medium">{projectName ? `Working with ${projectName}` : "No project selected"}</p>
      <p className="mt-2 text-muted-foreground">
        {projectName
          ? `${suiteName} uses the active project’s available knowledge, search, graph, and chat capabilities.`
          : "Choose a local project or PandaWiki knowledge base, then return to this workspace."}
      </p>
    </div>
  )
}
