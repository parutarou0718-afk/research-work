import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { NodeModel } from "@/types/wiki"
import { useWikiStore } from "@/stores/wiki-store"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import type { NodeEditorProvider } from "@/services/providers/contracts/NodeEditorProvider"
import { isPandaWikiProject } from "@/domain/projects"
import { PandaWikiNodeEditor } from "./panda-wiki-node-editor"

interface PandaWikiNodeReaderProps {
  knowledgeProvider?: KnowledgeProvider
  nodeEditor?: NodeEditorProvider
}

export function PandaWikiNodeReader({ knowledgeProvider, nodeEditor }: PandaWikiNodeReaderProps) {
  const selectedNodeId = useWikiStore((state) => state.providerSelectedNodeId)
  const node = useWikiStore((state) => selectedNodeId ? state.providerNodesById[selectedNodeId] : undefined)
  const status = useWikiStore((state) => state.providerNodeStatus)
  const error = useWikiStore((state) => state.providerNodeError)
  const activeProject = useWikiStore((state) => state.activeProject)
  const [editing, setEditing] = useState(false)

  if (!selectedNodeId) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a PandaWiki node to read it.</div>
  }
  if (status === "error") {
    return <div role="alert" className="flex h-full items-center justify-center px-6 text-sm text-destructive">{error}</div>
  }
  if (status === "loading" || !node) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading PandaWiki node…</div>
  }

  const canEdit = isPandaWikiProject(activeProject) && activeProject.capabilities.editNode && Boolean(nodeEditor && knowledgeProvider)
  if (editing && nodeEditor && knowledgeProvider) {
    return (
      <PandaWikiNodeEditor
        node={node}
        nodeEditor={nodeEditor}
        onCancel={() => setEditing(false)}
        onSaved={async () => {
          await useWikiStore.getState().loadProviderNode(knowledgeProvider, node.id)
          setEditing(false)
        }}
      />
    )
  }

  return <PandaWikiNodeDocument node={node} onEdit={canEdit ? () => setEditing(true) : undefined} />
}

/** Read-only rendering: remote content is never handed to the local editor. */
export function PandaWikiNodeDocument({ node, onEdit }: { node: NodeModel; onEdit?: () => void }) {
  return (
    <article className="mx-auto h-full max-w-4xl overflow-auto p-6">
      <div className="mb-6 border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{node.name}</h1>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
            >
              Edit remote node
            </button>
          )}
        </div>
        {node.summary && <p className="mt-2 text-sm text-muted-foreground">{node.summary}</p>}
      </div>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{node.content}</ReactMarkdown>
      </div>
    </article>
  )
}
