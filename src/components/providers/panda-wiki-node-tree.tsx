import { useState } from "react"
import { BookOpen, ChevronDown, ChevronRight, FileText } from "lucide-react"
import type { FileTreeNode } from "@/types/wiki"

interface PandaWikiNodeTreeProps {
  roots: FileTreeNode[]
  selectedNodeId: string | null
  onSelect(nodeId: string): void
}

/**
 * Read-only tree for mapped PandaWiki domain nodes. It deliberately accepts
 * no local path and therefore cannot trigger Tauri filesystem commands.
 */
export function PandaWikiNodeTree({ roots, selectedNodeId, onSelect }: PandaWikiNodeTreeProps) {
  return (
    <div className="p-2">
      {roots.map((node) => (
        <PandaWikiNodeTreeRow
          key={node.id}
          node={node}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function PandaWikiNodeTreeRow({
  node,
  selectedNodeId,
  onSelect,
  depth = 0,
}: {
  node: FileTreeNode
  selectedNodeId: string | null
  onSelect(nodeId: string): void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0

  return (
    <div>
      <div
        className={selectedNodeId === node.id
          ? "flex items-center rounded-md bg-accent"
          : "flex items-center rounded-md hover:bg-muted"}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
            aria-label={expanded ? "Collapse PandaWiki node" : "Expand PandaWiki node"}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : <span className="w-6" />}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm"
          onClick={() => onSelect(node.id)}
        >
          {hasChildren ? <BookOpen className="h-3.5 w-3.5 shrink-0" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
      </div>
      {expanded && node.children.map((child) => (
        <PandaWikiNodeTreeRow
          key={child.id}
          node={child}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
