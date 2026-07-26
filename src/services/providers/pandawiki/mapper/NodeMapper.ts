import type { FileTreeModel, FileTreeNode, NodeModel } from "@/types/wiki"
import type { NodeDTO, NodeListItemDTO, NodeTreeDTO } from "../dto/NodeDTO"

export function mapNodeDto(dto: NodeDTO): NodeModel {
  return {
    id: dto.id,
    knowledgeBaseId: dto.kb_id,
    name: dto.name,
    content: dto.content,
    parentId: dto.parent_id || null,
    navId: dto.nav_id,
    type: dto.type,
    status: dto.status,
    summary: dto.summary,
    emoji: dto.emoji,
    updatedAt: dto.updated_at,
  }
}

function mapTreeNode(dto: NodeListItemDTO): FileTreeNode {
  return {
    id: dto.id,
    name: dto.name,
    parentId: dto.parent_id || null,
    nodeType: dto.type,
    status: dto.status,
    children: [],
  }
}

export function mapNodeTreeDto(dto: NodeTreeDTO): FileTreeModel {
  const nodes = dto.groups
    .flatMap((group) => group.list)
    .sort((left, right) => left.position - right.position)
    .map(mapTreeNode)
  const byID = new Map(nodes.map((node) => [node.id, node]))
  const roots: FileTreeNode[] = []

  for (const node of nodes) {
    const parent = node.parentId ? byID.get(node.parentId) : undefined
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return { knowledgeBaseId: dto.kb_id, roots }
}
