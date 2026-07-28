# PandaWiki Client Capability Audit

Date: 2026-07-28

## Verified client integration

| Capability | Client adapter | Server route | Status |
|---|---|---|---|
| Login | `api/auth-api.ts` | `/api/v1/user/login` | Implemented and previously verified against LAN deployment |
| Knowledge-base list | `api/knowledge-api.ts` | `/api/v1/knowledge_base/list` | Implemented |
| Knowledge navigation | `api/node-api.ts` | `/api/v1/node/list/group/nav?kb_id=...` | Implemented |
| Node detail | `api/node-api.ts` | `/api/v1/node/detail?kb_id=...&id=...` | Implemented |
| Provider workspace | `components/providers/panda-wiki-workspace.tsx` | Above APIs | Implemented |

## Declared but not yet wired end-to-end

| Capability | Current code | Status |
|---|---|---|
| OpenAI-compatible RAG chat | PandaWiki service endpoint has been verified separately | Main `ChatPanel` does not yet use a ConversationProvider adapter |
| Conversation history/SSE | DTO and Mapper exist | No complete API adapter or UI routing |
| Document upload/status | DTO and Mapper exist | No complete API adapter or UI routing |
| Search | Capability flag is `true` | No complete API adapter or UI routing |
| Graph/entities/relations | DTO and Mapper skeleton exists; capability flag is `false` | Not implemented |

Capability flags must reflect adapters that are actually callable, rather than planned features.

## Recommended PandaWiki server responsibility

```text
Upload/source change
  -> async parse queue
  -> normalized text chunks
  -> embeddings/vector index
  -> optional entity/relation extraction queue
  -> metadata and group_ids permission binding
  -> retrieval API / RAG API / citation API
```

The desktop UI should request trees, individual node content, authorized search hits and cited chunks. It should not read every source file, generate embeddings or build an index locally.

## Entity extraction contract for a later phase

Each extracted entity or relation must preserve both provenance and access scope:

```json
{
  "id": "entity_...",
  "type": "organization",
  "name": "Example Corp",
  "attributes": {},
  "source_document_id": "doc_...",
  "source_chunk_id": "chunk_...",
  "group_ids": ["group_..."],
  "confidence": 0.92,
  "extractor_version": "v1"
}
```

The server must filter by `group_ids` before returning entities, relations, search hits or RAG chunks. A client-side filter is not sufficient.

## Data retention trade-off

- Recommended enterprise mode: retain encrypted source files, chunks, vectors and citation metadata.
- Reduced-retention mode: retain chunks/vectors/entities but not raw source files; source preview and reprocessing become limited.
- Vector-only mode is not recommended: it weakens citations and is not equivalent to deleting sensitive information.

## Next integration order

1. Correct capability flags to match completed adapters.
2. Add a `ConversationProvider` adapter for PandaWiki OpenAI-compatible chat with citations.
3. Add document upload/status adapter.
4. Add a server-backed search adapter.
5. Only then add a graph/entity capability with permission-safe provenance.
