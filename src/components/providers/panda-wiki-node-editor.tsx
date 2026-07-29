import { useState } from "react"
import type { NodeModel } from "@/types/wiki"
import type { NodeEditorProvider } from "@/services/providers/contracts/NodeEditorProvider"

interface PandaWikiNodeEditorProps {
  node: NodeModel
  nodeEditor: NodeEditorProvider
  onCancel: () => void
  onSaved: () => void | Promise<void>
}

/**
 * A minimal remote editor. It never maps a PandaWiki node to a local path;
 * authorization remains the server's document-management decision.
 */
export function PandaWikiNodeEditor({ node, nodeEditor, onCancel, onSaved }: PandaWikiNodeEditorProps) {
  const [name, setName] = useState(node.name)
  const [content, setContent] = useState(node.content)
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")

  const save = async (): Promise<void> => {
    if (!name.trim() || status === "saving") return
    setStatus("saving")
    try {
      await nodeEditor.updateNode({
        knowledgeBaseId: node.knowledgeBaseId,
        nodeId: node.id,
        name: name.trim(),
        content,
      })
      await onSaved()
    } catch {
      setStatus("error")
    }
  }

  return (
    <section className="mx-auto flex h-full max-w-4xl flex-col gap-4 overflow-hidden p-6">
      <header className="shrink-0 border-b pb-4">
        <h1 className="text-xl font-semibold">Edit remote node</h1>
        <p className="mt-1 text-sm text-muted-foreground">Changes are saved directly to PandaWiki and checked by server permissions.</p>
      </header>
      <label className="flex shrink-0 flex-col gap-1.5 text-sm font-medium">
        Title
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={status === "saving"}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="flex min-h-0 flex-1 flex-col gap-1.5 text-sm font-medium">
        Content
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={status === "saving"}
          className="min-h-0 flex-1 resize-none rounded-md border bg-background p-3 font-mono text-sm"
        />
      </label>
      {status === "error" && (
        <p role="alert" className="text-sm text-destructive">PandaWiki could not save this node. Check your document-management permission and try again.</p>
      )}
      <footer className="flex shrink-0 justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={status === "saving"} className="rounded-md border px-3 py-2 text-sm hover:bg-accent">
          Cancel
        </button>
        <button type="button" onClick={() => void save()} disabled={!name.trim() || status === "saving"} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {status === "saving" ? "Saving…" : "Save to PandaWiki"}
        </button>
      </footer>
    </section>
  )
}
