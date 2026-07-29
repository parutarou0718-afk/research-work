import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PanelLeftClose } from "lucide-react"
import { KnowledgeTree } from "./knowledge-tree"
import { FileTree } from "./file-tree"
import { useWikiStore } from "@/stores/wiki-store"
import { isPandaWikiProject } from "@/domain/projects"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import { PandaWikiNodeTree } from "@/components/providers/panda-wiki-node-tree"
import { PandaWikiKnowledgeNavigation } from "@/components/providers/panda-wiki-knowledge-navigation"
import type { GraphProvider } from "@/services/providers/contracts/GraphProvider"

interface SidebarPanelProps {
  onCollapse?: () => void
  pandaWikiKnowledgeProvider?: KnowledgeProvider
  pandaWikiGraphProvider?: GraphProvider
}

export function SidebarPanel({ onCollapse, pandaWikiKnowledgeProvider, pandaWikiGraphProvider }: SidebarPanelProps) {
  const { t } = useTranslation()
  const activeProject = useWikiStore((s) => s.activeProject)
  const providerTree = useWikiStore((s) => s.providerFileTree)
  const providerStatus = useWikiStore((s) => s.providerKnowledgeStatus)
  const providerError = useWikiStore((s) => s.providerKnowledgeError)
  const selectedProviderNodeId = useWikiStore((s) => s.providerSelectedNodeId)
  const selectProviderNode = useWikiStore((s) => s.selectProviderNode)
  const [mode, setMode] = useState<"knowledge" | "files">("knowledge")

  if (isPandaWikiProject(activeProject)) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
          {activeProject.name}
        </div>
        {providerStatus === "loading" && <div className="p-4 text-sm text-muted-foreground">Loading PandaWiki nodes…</div>}
        {providerStatus === "error" && <div role="alert" className="p-4 text-sm text-destructive">{providerError}</div>}
        {providerStatus === "ready" && !providerTree && <div className="p-4 text-sm text-muted-foreground">No PandaWiki nodes are available.</div>}
        {providerTree && pandaWikiKnowledgeProvider && (
          <div className="min-h-0 flex-1 overflow-auto">
            <PandaWikiNodeTree
              roots={providerTree.roots}
              selectedNodeId={selectedProviderNodeId}
              onSelect={(nodeId) => {
                void selectProviderNode(pandaWikiKnowledgeProvider, nodeId).catch(() => undefined)
              }}
            />
          </div>
        )}
        <div className="shrink-0 border-t">
          <PandaWikiKnowledgeNavigation graphProvider={pandaWikiGraphProvider} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 border-b">
        <button
          onClick={() => setMode("knowledge")}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "knowledge"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("sidebar.knowledge")}
        </button>
        <button
          onClick={() => setMode("files")}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "files"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("sidebar.files")}
        </button>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="flex w-9 shrink-0 items-center justify-center border-l text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={t("layout.hideSidebar", "Hide sidebar")}
            aria-label={t("layout.hideSidebar", "Hide sidebar")}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {mode === "knowledge" ? <KnowledgeTree /> : <FileTree />}
      </div>
    </div>
  )
}
