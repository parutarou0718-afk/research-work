import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { BookOpen, ChevronDown, ChevronRight, FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProviderSettings } from "@/components/settings/ProviderSettings"
import { useWikiStore } from "@/stores/wiki-store"
import type { ProviderBundle } from "@/services/providers/contracts/ProviderBundle"
import type { FileTreeNode } from "@/types/wiki"
import { PandaWikiAskPanel } from "./panda-wiki-ask-panel"
import { createTauriPandaWikiChatCredentialStore } from "@/services/providers/pandawiki/chat/PandaWikiChatCredentialStore"
import { loadPandaWikiChatConfig, savePandaWikiChatConfig, type PandaWikiChatConfig } from "@/services/providers/pandawiki/chat/PandaWikiChatConfig"

interface PandaWikiWorkspaceProps {
  provider: ProviderBundle
  serverUrl: string
  account: string
  onLogout(): Promise<void>
}

/** Read-only Phase 1C surface. Local project, LLM, and ingest UI stay isolated. */
export function PandaWikiWorkspace({ provider, serverUrl, account, onLogout }: PandaWikiWorkspaceProps) {
  const knowledgeBases = useWikiStore((state) => state.providerKnowledgeBases)
  const tree = useWikiStore((state) => state.providerFileTree)
  const nodesById = useWikiStore((state) => state.providerNodesById)
  const status = useWikiStore((state) => state.providerKnowledgeStatus)
  const error = useWikiStore((state) => state.providerKnowledgeError)
  const loadKnowledge = useWikiStore((state) => state.loadProviderKnowledge)
  const loadNode = useWikiStore((state) => state.loadProviderNode)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeError, setNodeError] = useState<string | null>(null)
  const [chatConfig, setChatConfig] = useState<PandaWikiChatConfig>({ endpointUrl: "", model: "knowledge-base", timeoutSeconds: 90, providerName: "pandawiki" })
  const [chatTokenExists, setChatTokenExists] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : undefined

  useEffect(() => {
    void loadKnowledge(provider.knowledge)
  }, [loadKnowledge, provider.knowledge])

  useEffect(() => {
    let active = true
    void (async () => {
      const config = await loadPandaWikiChatConfig()
      if (!active) return
      setChatConfig(config)
      if (config.endpointUrl) setChatTokenExists(await createTauriPandaWikiChatCredentialStore().hasToken(config.endpointUrl))
    })()
    return () => { active = false }
  }, [])

  const saveChatConfig = async (nextConfig: PandaWikiChatConfig) => {
    setChatBusy(true)
    try {
      const saved = await savePandaWikiChatConfig(nextConfig)
      setChatConfig(saved)
      setChatTokenExists(saved.endpointUrl ? await createTauriPandaWikiChatCredentialStore().hasToken(saved.endpointUrl) : false)
    } finally { setChatBusy(false) }
  }

  const saveChatToken = async (endpointUrl: string, token: string) => {
    if (!endpointUrl) throw new Error("Save a complete endpoint URL before saving a token.")
    setChatBusy(true)
    try {
      await createTauriPandaWikiChatCredentialStore().saveToken(endpointUrl, token)
      setChatTokenExists(true)
    } finally { setChatBusy(false) }
  }

  const clearChatToken = async () => {
    if (!chatConfig.endpointUrl) return
    setChatBusy(true)
    try {
      await createTauriPandaWikiChatCredentialStore().clearToken(chatConfig.endpointUrl)
      setChatTokenExists(false)
    } finally { setChatBusy(false) }
  }

  const selectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId)
    setNodeError(null)
    try {
      await loadNode(provider.knowledge, nodeId)
    } catch {
      setNodeError("Unable to load this PandaWiki node.")
    }
  }

  return (
    <main className="flex h-full min-h-0 bg-background">
      <aside className="flex w-80 shrink-0 flex-col border-r">
        <div className="p-4">
          <ProviderSettings
            providerName={provider.capabilities.providerName}
            providerType={provider.type}
            serverUrl={serverUrl}
            connected
            account={account}
            onLogout={onLogout}
            chatConfig={chatConfig}
            chatTokenExists={chatTokenExists}
            chatBusy={chatBusy}
            onSaveChatConfig={saveChatConfig}
            onSaveChatToken={saveChatToken}
            onClearChatToken={clearChatToken}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col border-t">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-sm font-semibold">Knowledge bases</h1>
              <p className="text-xs text-muted-foreground">Authorized PandaWiki content</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Reload knowledge" onClick={() => { void loadKnowledge(provider.knowledge) }} disabled={status === "loading"}>
              <RefreshCw className={status === "loading" ? "animate-spin" : ""} />
            </Button>
          </div>
          {status === "loading" && <p className="px-4 text-sm text-muted-foreground">Loading knowledge…</p>}
          {status === "error" && <p role="alert" className="px-4 text-sm text-destructive">{error}</p>}
          {status === "ready" && knowledgeBases.length === 0 && <p className="px-4 text-sm text-muted-foreground">No knowledge bases are available to this account.</p>}
          {status === "ready" && tree && (
            <div className="min-h-0 flex-1 overflow-auto px-2 pb-4">
              <div className="mb-2 rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                {knowledgeBases.find((knowledgeBase) => knowledgeBase.id === tree.knowledgeBaseId)?.name ?? "Knowledge base"}
              </div>
              {tree.roots.map((node) => <ProviderTreeNode key={node.id} node={node} selectedNodeId={selectedNodeId} onSelect={selectNode} />)}
            </div>
          )}
        </div>
      </aside>
      <section className="min-w-0 flex-1 overflow-auto">
        {!selectedNodeId && <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a PandaWiki node to read it.</div>}
        {selectedNodeId && !selectedNode && !nodeError && <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading node…</div>}
        {nodeError && <div role="alert" className="flex h-full items-center justify-center px-6 text-sm text-destructive">{nodeError}</div>}
        {selectedNode && (
          <article className="mx-auto max-w-4xl p-6">
            <div className="mb-6 border-b pb-4">
              <h2 className="text-2xl font-semibold">{selectedNode.name}</h2>
              {selectedNode.summary && <p className="mt-2 text-sm text-muted-foreground">{selectedNode.summary}</p>}
            </div>
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNode.content}</ReactMarkdown>
            </div>
          </article>
        )}
      </section>
      <PandaWikiAskPanel config={chatConfig} />
    </main>
  )
}

function ProviderTreeNode({ node, selectedNodeId, onSelect, depth = 0 }: {
  node: FileTreeNode
  selectedNodeId: string | null
  onSelect(nodeId: string): void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  return (
    <div>
      <div className={selectedNodeId === node.id ? "flex items-center rounded-md bg-accent" : "flex items-center rounded-md hover:bg-muted"} style={{ paddingLeft: `${depth * 12}px` }}>
        {hasChildren ? (
          <Button variant="ghost" size="icon-xs" aria-label={expanded ? "Collapse node" : "Expand node"} onClick={() => setExpanded((value) => !value)}>
            {expanded ? <ChevronDown /> : <ChevronRight />}
          </Button>
        ) : <span className="w-6" />}
        <button className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm" onClick={() => onSelect(node.id)}>
          {hasChildren ? <BookOpen className="h-3.5 w-3.5 shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
      </div>
      {expanded && node.children.map((child) => <ProviderTreeNode key={child.id} node={child} selectedNodeId={selectedNodeId} onSelect={onSelect} depth={depth + 1} />)}
    </div>
  )
}
