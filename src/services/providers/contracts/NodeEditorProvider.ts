/** A provider-neutral request for updating an existing knowledge node. */
export interface NodeUpdateInput {
  knowledgeBaseId: string
  nodeId: string
  name: string
  content: string
}

/** Write capability kept separate from the read-only KnowledgeProvider. */
export interface NodeEditorProvider {
  updateNode(input: NodeUpdateInput): Promise<void>
}
