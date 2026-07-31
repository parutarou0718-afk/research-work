import { useEffect, useState } from "react"
import { ArrowRight, BookOpen, Building2, CalendarDays, FileSearch, MessageSquareText, Network, Scale, Search, ShieldAlert, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { PluginPageProps } from "@/core/plugins/host/types"
import { useWikiStore } from "@/stores/wiki-store"
import {
  getVisibleSuiteMenuItems,
  WORKSPACE_SUITES,
  type WorkspaceSuiteId,
} from "./domain/workspace-suites"
import { RemoteGraphSnapshot, type RemoteGraphSnapshotMode } from "./components/remote-graph-snapshot"
import { LocalWorkspaceRecords } from "./components/local-workspace-records"

const ITEM_ICONS = {
  overview: BookOpen,
  documents: FileSearch,
  search: Search,
  graph: Network,
  chat: MessageSquareText,
  submissions: FileSearch,
  matters: Scale,
  timeline: CalendarDays,
  companies: Building2,
  risks: ShieldAlert,
} as const

export function IndustryWorkspacesPage({ host, graphProvider, suiteId }: PluginPageProps & { suiteId: WorkspaceSuiteId }) {
  const { t } = useTranslation()
  const [project, setProject] = useState(host.project.current())
  const suite = WORKSPACE_SUITES.find((candidate) => candidate.id === suiteId) ?? WORKSPACE_SUITES[0]
  const visibleItems = getVisibleSuiteMenuItems(suite, project)

  useEffect(() => host.project.subscribe(() => setProject(host.project.current())), [host])

  function openWorkspaceAction(item: typeof visibleItems[number]) {
    if (item.targetView) {
      useWikiStore.getState().setActiveView(item.targetView)
      return
    }
    if (item.route) useWikiStore.getState().setActivePluginRoute(item.route)
  }

  return (
    <section className="h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-xl border bg-muted/20 p-5">
          <div className="flex items-start gap-3">
            <SuiteIcon suiteId={suite.id} />
            <div>
              <h1 className="text-xl font-semibold">{t(`workspaces.suite.${suite.id}.name`)}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t(`workspaces.suite.${suite.id}.description`)}</p>
              <p className="mt-3 text-xs text-muted-foreground">{project?.name ?? t("workspaces.projectHint")}</p>
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.filter((item) => item.id !== "overview").map((item) => {
            const Icon = ITEM_ICONS[item.id as keyof typeof ITEM_ICONS] ?? BookOpen
            return (
              <button key={item.id} type="button" onClick={() => openWorkspaceAction(item)} className="group rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/40">
                <div className="flex items-start justify-between gap-3"><Icon className="h-5 w-5 text-primary" /><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></div>
                <h2 className="mt-4 font-medium">{t(`workspaces.menu.${item.id}.label`)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t(`workspaces.menu.${item.id}.description`)}</p>
              </button>
            )
          })}
        </div>

        <WorkspaceDataSections suiteId={suite.id} graphProvider={graphProvider} project={project} host={host} />
      </div>
    </section>
  )
}

function SuiteIcon({ suiteId }: { suiteId: WorkspaceSuiteId }) {
  const Icon = suiteId === "research" ? BookOpen : suiteId === "legal" ? Scale : TrendingUp
  return <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="h-6 w-6" /></div>
}

function WorkspaceDataSections({ suiteId, graphProvider, project, host }: {
  suiteId: WorkspaceSuiteId
  graphProvider: PluginPageProps["graphProvider"]
  project: ReturnType<PluginPageProps["host"]["project"]["current"]>
  host: PluginPageProps["host"]
}) {
  if (!project) return <WorkspaceOverview projectName={null} />
  if (project.source === "local") return <LocalWorkspaceRecords host={host} suiteId={suiteId} />
  const modes = getSuiteGraphSnapshotModes(suiteId)
  if (modes.length === 0) return <WorkspaceOverview projectName={project.name} />
  return <div className="mt-6 grid gap-6 xl:grid-cols-2">{modes.map((mode) => <RemoteGraphSnapshot key={mode} graphProvider={graphProvider} project={project} mode={mode} />)}</div>
}

function getSuiteGraphSnapshotModes(suiteId: WorkspaceSuiteId): RemoteGraphSnapshotMode[] {
  if (suiteId === "legal") return ["legal-matters", "legal-timeline"]
  if (suiteId === "investment") return ["investment-companies", "investment-risks"]
  return []
}

function WorkspaceOverview({ projectName }: { projectName: string | null }) {
  const { t } = useTranslation()
  return (
    <div className="mt-6 rounded-lg border bg-muted/20 p-5 text-sm">
      <p className="font-medium">{projectName ? t("workspaces.workingWith", { name: projectName }) : t("workspaces.noProject")}</p>
      <p className="mt-2 text-muted-foreground">{t("workspaces.returnHint")}</p>
    </div>
  )
}
