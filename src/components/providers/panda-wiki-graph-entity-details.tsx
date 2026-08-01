import type { EntityModel, KnowledgeGraphModel } from "@/types/wiki"

interface PandaWikiGraphEntityDetailsProps {
  entity: EntityModel
  graph: KnowledgeGraphModel
  onOpenEvidence(nodeId: string): Promise<void>
}

/**
 * Safe read-only details for one server-provided graph entity. The summary
 * has already been generated and permission-filtered by PandaWiki.
 */
export function PandaWikiGraphEntityDetails({ entity, graph, onOpenEvidence }: PandaWikiGraphEntityDetailsProps) {
  const related = graph.relations.filter((relation) => relation.sourceId === entity.id || relation.targetId === entity.id)
  const summary = entity.summary?.trim()

  return <section>
    <h2 className="text-base font-semibold">{entity.name}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{entity.type} · {related.length} 条关系</p>

    <div className="mt-4 border-t pt-3 text-xs font-medium text-muted-foreground">服务器摘要</div>
    {summary
      ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{summary}</p>
      : <p className="mt-2 text-sm text-muted-foreground">该实体尚未生成服务器摘要。</p>}

    {Object.entries(entity.attributes).map(([key, values]) => (
      <div key={key} className="mt-3 text-sm">
        <div className="text-xs font-medium text-muted-foreground">{key}</div>
        <div className="mt-1 whitespace-pre-wrap break-words">{Array.isArray(values) ? values.join("、") : String(values)}</div>
      </div>
    ))}

    <div className="mt-5 border-t pt-3 text-xs font-medium text-muted-foreground">来源证据</div>
    {related.flatMap((relation) => relation.evidence).slice(0, 8).map((evidence) => (
      <button key={`${evidence.nodeId}:${evidence.nodeReleaseId}`} type="button" onClick={() => { void onOpenEvidence(evidence.nodeId) }} className="mt-2 block w-full rounded border p-2 text-left text-xs hover:bg-accent">
        <span className="line-clamp-3">{evidence.excerpt || "打开来源文档"}</span>
      </button>
    ))}
    {related.length === 0 && <p className="mt-2 text-sm text-muted-foreground">该实体没有可见关系。</p>}
  </section>
}
