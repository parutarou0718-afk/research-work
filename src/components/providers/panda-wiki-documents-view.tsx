import { useRef, useState } from "react"
import { open } from "@tauri-apps/plugin-dialog"
import { FileUp, LoaderCircle, X } from "lucide-react"
import { readFileAsBase64 } from "@/commands/fs"
import { isPandaWikiProject } from "@/domain/projects"
import type { DocumentProvider } from "@/services/providers/contracts/DocumentProvider"
import type { KnowledgeProvider } from "@/services/providers/contracts/KnowledgeProvider"
import { useWikiStore } from "@/stores/wiki-store"

interface PandaWikiDocumentsViewProps {
  documentProvider: DocumentProvider
  knowledgeProvider: KnowledgeProvider
}

export function getPandaWikiDocumentName(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] ?? "document"
}

/** Converts an ephemeral Tauri read result to transport bytes only. */
export function decodePandaWikiDocumentBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

/**
 * Server Documents surface for PandaWiki virtual projects. It intentionally
 * never mounts SourcesView or derives a local project path.
 */
export function PandaWikiDocumentsView({ documentProvider, knowledgeProvider }: PandaWikiDocumentsViewProps) {
  const activeProject = useWikiStore((state) => state.activeProject)
  const selectedNodeId = useWikiStore((state) => state.providerSelectedNodeId)
  const selectedNode = useWikiStore((state) => selectedNodeId ? state.providerNodesById[selectedNodeId] : undefined)
  const [status, setStatus] = useState<"idle" | "importing" | "success" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)
  const abortController = useRef<AbortController | null>(null)

  const canImport = isPandaWikiProject(activeProject) && Boolean(selectedNode?.navId)

  const chooseAndImport = async (): Promise<void> => {
    if (!isPandaWikiProject(activeProject) || !selectedNode?.navId) return
    const selectedPath = await open({
      multiple: false,
      directory: false,
      title: "Choose a document for PandaWiki",
      filters: [{ name: "Documents", extensions: ["pdf", "doc", "docx", "md", "txt", "html", "ppt", "pptx", "xls", "xlsx"] }],
    })
    if (!selectedPath || Array.isArray(selectedPath)) return

    const scopeKey = activeProject.scopeKey
    const controller = new AbortController()
    abortController.current = controller
    setStatus("importing")
    setMessage(null)
    try {
      const file = await readFileAsBase64(selectedPath)
      const imported = await documentProvider.importDocument({
        knowledgeBaseId: activeProject.knowledgeBaseId,
        navigationId: selectedNode.navId,
        name: getPandaWikiDocumentName(selectedPath),
        mimeType: file.mimeType,
        bytes: decodePandaWikiDocumentBytes(file.base64),
        signal: controller.signal,
      })
      const currentProject = useWikiStore.getState().activeProject
      if (!isPandaWikiProject(currentProject) || currentProject.scopeKey !== scopeKey) return
      await useWikiStore.getState().loadProviderKnowledge(knowledgeProvider)
      await useWikiStore.getState().selectProviderNode(knowledgeProvider, imported.nodeId)
      setStatus("success")
      setMessage(`Imported ${imported.name} into PandaWiki.`)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle")
        setMessage("Document import cancelled.")
      } else {
        setStatus("error")
        setMessage("PandaWiki could not import this document. Check your document-management permission and try again.")
      }
    } finally {
      abortController.current = null
    }
  }

  const cancelImport = (): void => abortController.current?.abort()

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b px-5 py-4">
        <h1 className="text-lg font-semibold">PandaWiki Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Files are uploaded, parsed, and stored by PandaWiki. They are not added to this computer&apos;s local project index.
        </p>
      </header>
      <main className="flex flex-1 items-center justify-center overflow-auto p-6">
        <section className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <FileUp className="mt-0.5 h-6 w-6 text-muted-foreground" />
            <div>
              <h2 className="font-medium">Import one document</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {canImport
                  ? `Destination: ${selectedNode?.name}`
                  : "Open a PandaWiki node in Knowledge first to choose its server navigation destination."}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canImport || status === "importing"}
              onClick={() => void chooseAndImport()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "importing" ? <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />Importing on PandaWiki…</span> : "Choose document"}
            </button>
            {status === "importing" && (
              <button type="button" onClick={cancelImport} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm">
                <X className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
          {message && (
            <p role={status === "error" ? "alert" : "status"} className={`mt-4 text-sm ${status === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {message}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
