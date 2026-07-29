import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { NodeModel } from "@/types/wiki"
import { useWikiStore } from "@/stores/wiki-store"

export function PandaWikiNodeReader() {
  const selectedNodeId = useWikiStore((state) => state.providerSelectedNodeId)
  const node = useWikiStore((state) => selectedNodeId ? state.providerNodesById[selectedNodeId] : undefined)
  const status = useWikiStore((state) => state.providerNodeStatus)
  const error = useWikiStore((state) => state.providerNodeError)

  if (!selectedNodeId) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a PandaWiki node to read it.</div>
  }
  if (status === "error") {
    return <div role="alert" className="flex h-full items-center justify-center px-6 text-sm text-destructive">{error}</div>
  }
  if (status === "loading" || !node) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading PandaWiki node…</div>
  }

  return <PandaWikiNodeDocument node={node} />
}

/** Read-only rendering: remote content is never handed to the local editor. */
export function PandaWikiNodeDocument({ node }: { node: NodeModel }) {
  return (
    <article className="mx-auto h-full max-w-4xl overflow-auto p-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-semibold">{node.name}</h1>
        {node.summary && <p className="mt-2 text-sm text-muted-foreground">{node.summary}</p>}
      </div>
      <div className="prose prose-neutral max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{node.content}</ReactMarkdown>
      </div>
    </article>
  )
}
