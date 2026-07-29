/**
 * A desktop-selected file that will be uploaded to a remote knowledge base.
 * The bytes are transient: the application never writes them into a local
 * project, queue, or index for PandaWiki virtual projects.
 */
export interface RemoteDocumentImportInput {
  knowledgeBaseId: string
  navigationId: string
  name: string
  mimeType: string
  bytes: Uint8Array
  /** Cancels only this remote request chain; it never affects local queues. */
  signal?: AbortSignal
}

/** The server-created node that represents an imported document. */
export interface RemoteDocumentImportResult {
  nodeId: string
  name: string
}

/**
 * Narrow remote-document capability. It deliberately does not expose local
 * filesystem or source-ingestion operations.
 */
export interface DocumentProvider {
  importDocument(input: RemoteDocumentImportInput): Promise<RemoteDocumentImportResult>
}
