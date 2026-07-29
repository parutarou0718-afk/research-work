import { useEffect, useState } from "react"
import { useWikiStore } from "@/stores/wiki-store"
import { ChatPanel } from "@/components/chat/chat-panel"
import { SettingsView } from "@/components/settings/settings-view"
import { SkillsSection } from "@/components/settings/sections/skills-section"
import { SourcesView } from "@/components/sources/sources-view"
import { ReviewView } from "@/components/review/review-view"
import { LintView } from "@/components/lint/lint-view"
import { SearchView } from "@/components/search/search-view"
import { GraphView } from "@/components/graph/graph-view"
import { usePlugins } from "@/core/plugins/usePlugins"
import { isPandaWikiProject } from "@/domain/projects"
import { isViewAvailable, usesPandaWikiChatSurface } from "@/lib/project-capabilities"
import { PreviewPanel } from "./preview-panel"
import { RemoteProjectHome } from "./remote-project-home"
import { PandaWikiNodeReader } from "@/components/providers/panda-wiki-node-reader"
import { PandaWikiRemoteChat } from "@/components/providers/panda-wiki-remote-chat"
import { PandaWikiSearchView } from "@/components/providers/panda-wiki-search-view"
import { PandaWikiDocumentsView } from "@/components/providers/panda-wiki-documents-view"
import { PluginsSection } from "@/components/settings/sections/plugins-section"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import type { SearchProvider } from "@/services/providers/contracts/SearchProvider"
import type { NodeEditorProvider } from "@/services/providers/contracts/NodeEditorProvider"
import type { DocumentProvider } from "@/services/providers/contracts/DocumentProvider"
import { usesPandaWikiDocumentSurface, usesPandaWikiSearchSurface } from "@/lib/project-capabilities"

interface ContentAreaProps {
  pandaWikiKnowledgeProvider?: KnowledgeProvider
  pandaWikiSearchProvider?: SearchProvider
  pandaWikiNodeEditor?: NodeEditorProvider
  pandaWikiDocumentProvider?: DocumentProvider
}

export function ContentArea({ pandaWikiKnowledgeProvider, pandaWikiSearchProvider, pandaWikiNodeEditor, pandaWikiDocumentProvider }: ContentAreaProps) {
  const activeView = useWikiStore((s) => s.activeView)
  const activeProject = useWikiStore((s) => s.activeProject)

  if (isPandaWikiProject(activeProject) && !isViewAvailable(activeProject, activeView)) {
    return <RemoteProjectHome project={activeProject} onNavigate={(view) => useWikiStore.getState().setActiveView(view)} />
  }

  // A remote Documents surface is intentionally separate from local
  // SourcesView, which owns local project paths, queues, and indexes.
  if (isPandaWikiProject(activeProject) && usesPandaWikiDocumentSurface(activeProject) && activeView === "sources") {
    return pandaWikiKnowledgeProvider && pandaWikiDocumentProvider
      ? <PandaWikiDocumentsView knowledgeProvider={pandaWikiKnowledgeProvider} documentProvider={pandaWikiDocumentProvider} />
      : <RemoteProjectHome project={activeProject} onNavigate={(view) => useWikiStore.getState().setActiveView(view)} />
  }

  // Keep SourcesView mounted after its first visit. Opening a source uses the
  // full-width wiki preview, and unmounting the source tree here would discard
  // its scroll position, expanded folders, and incremental row limit. Hiding
  // the mounted view makes closing the preview a true return operation.
  const [hasMountedSources, setHasMountedSources] = useState(activeView === "sources")

  useEffect(() => {
    if (activeView === "sources") setHasMountedSources(true)
  }, [activeView])

  // Include the current view directly so the first navigation to Sources does
  // not wait for the effect above and briefly render an empty content area.
  if (hasMountedSources || activeView === "sources") {
    return (
      <>
        <div className={activeView === "sources" ? "h-full" : "hidden"}>
          <SourcesView />
        </div>
        {activeView !== "sources" && <ActiveContent activeView={activeView} pandaWikiKnowledgeProvider={pandaWikiKnowledgeProvider} pandaWikiSearchProvider={pandaWikiSearchProvider} pandaWikiNodeEditor={pandaWikiNodeEditor} />}
      </>
    )
  }

  return <ActiveContent activeView={activeView} pandaWikiKnowledgeProvider={pandaWikiKnowledgeProvider} pandaWikiSearchProvider={pandaWikiSearchProvider} pandaWikiNodeEditor={pandaWikiNodeEditor} />
}

function ActiveContent({
  activeView,
  pandaWikiKnowledgeProvider,
  pandaWikiSearchProvider,
  pandaWikiNodeEditor,
}: {
  activeView: ReturnType<typeof useWikiStore.getState>["activeView"]
  pandaWikiKnowledgeProvider?: KnowledgeProvider
  pandaWikiSearchProvider?: SearchProvider
  pandaWikiNodeEditor?: NodeEditorProvider
}) {
  const activePluginRoute = useWikiStore((s) => s.activePluginRoute)
  const activeProject = useWikiStore((s) => s.activeProject)
  const { getPluginByRoute, host } = usePlugins()
  switch (activeView) {
    case "chat":
      return usesPandaWikiChatSurface(activeProject)
        ? <PandaWikiRemoteChat />
        : <ChatPanel />
    case "wiki":
      return isPandaWikiProject(activeProject)
        ? <PandaWikiNodeReader knowledgeProvider={pandaWikiKnowledgeProvider} nodeEditor={pandaWikiNodeEditor} />
        : <PreviewPanel />
    case "settings":
      return <SettingsView />
    case "skills":
      return <SkillsView />
    case "sources":
      return null
    case "review":
      return <ReviewView />
    case "lint":
      return <LintView />
    case "search":
      return isPandaWikiProject(activeProject) && usesPandaWikiSearchSurface(activeProject)
        ? pandaWikiKnowledgeProvider && pandaWikiSearchProvider
          ? <PandaWikiSearchView knowledgeProvider={pandaWikiKnowledgeProvider} searchProvider={pandaWikiSearchProvider} />
          : <RemoteProjectHome project={activeProject} onNavigate={(view) => useWikiStore.getState().setActiveView(view)} />
        : <SearchView />
    case "graph":
      return <GraphView />
    case "plugin": {
      const plugin = activePluginRoute ? getPluginByRoute(activePluginRoute) : undefined
      const PluginPage = plugin?.page
      return PluginPage ? <PluginPage host={host} /> : <PluginLibrary />
    }
    default:
      return <PreviewPanel />
  }
}

function PluginLibrary() {
  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="mx-auto max-w-3xl">
        <PluginsSection />
      </div>
    </div>
  )
}

function SkillsView() {
  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="mx-auto max-w-3xl">
        <SkillsSection />
      </div>
    </div>
  )
}
