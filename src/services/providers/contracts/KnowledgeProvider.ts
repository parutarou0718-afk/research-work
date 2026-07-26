import type { FileTreeModel, KnowledgeModel, NodeModel } from "@/types/wiki"

export interface KnowledgeProvider {
  listKnowledgeBases(): Promise<KnowledgeModel[]>
  getNode(id: string): Promise<NodeModel>
  getNodeTree(): Promise<FileTreeModel>
}
