# PandaWiki Search Contract Audit

Date: 2026-07-28

## Located server route

The current PandaWiki source contains `POST /share/v1/chat/search`.

Route registration: `PandaWiki-main/backend/handler/share/chat.go`.
Request and response types: `PandaWiki-main/backend/domain/chat.go`.

The request body contains `message` and `captcha_token`; the handler overwrites
the knowledge-base ID from `X-KB-ID`, requires that header, validates captcha,
and relies on share-chat middleware. Its response is `data.node_result` with
ranked node chunks.

## Decision: not integrated

This is not a compatible management-session search contract for the desktop
Provider. It requires `X-KB-ID`, calls captcha validation, and is a share-chat
endpoint rather than a verified authenticated-user search API. A client-side
KB choice cannot prove that the current user is authorized to search that KB.

The desktop `search` capability therefore remains `false`. No search UI, DTO,
mapper, or adapter is added in this task.

## Required server contract

A future PandaWiki route must authenticate the management user and perform
authorization before retrieval, for example:

```text
POST /api/v1/knowledge_base/:kb_id/search
Authorization: Bearer <management session>
{ "query": "...", "page": 1, "page_size": 20 }
```

The server must derive user and group scope itself, return 403 for an
unauthorized knowledge base, and return only permitted snippets with a stable
`node_id` for navigation. The desktop client must not send `group_ids`, use
`X-KB-ID`, or filter results locally.

## Next verification sequence

1. Add or locate the authenticated server-side search route in PandaWiki.
2. Verify it on the LAN deployment with a normal user session: 200, 401, 403,
   empty result, and malformed-response cases.
3. Only then add the client DTO, mapper, adapter, and minimal workspace search
   UI.
