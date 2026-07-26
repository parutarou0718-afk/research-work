# Research Work

Research Work is a modified fork of **LLM Wiki** for personal research workflow management.

It keeps the original LLM Wiki knowledge-base foundation and adds a more research-oriented workflow:

- document and source ingestion
- Markdown Wiki knowledge base
- knowledge graph
- idea capture
- quick idea capture
- bidirectional idea / knowledge linking
- submission management
- Chinese and English interface support
- GitHub Actions desktop builds for testing

This repository is not presented as a fully original application. It is a fork-based modification of an existing GPL-3.0 open-source project.

## Origin and Attribution

Original project:

[nashsu/llm_wiki](https://github.com/nashsu/llm_wiki)

Original license:

GPL-3.0

Original project summary:

LLM Wiki is a cross-platform desktop application that turns documents into an organized, interlinked knowledge base. It supports source ingestion, LLM-assisted Wiki generation, search, graph visualization, review workflows, and local project persistence.

Research Work builds on that foundation and adds research-specific workflow features for paper submission tracking, idea capture, and knowledge linking.

## License

This modified fork is distributed under the same license as the original project:

GPL-3.0

The full license text is included in [LICENSE](LICENSE).

If you distribute a built application, installer, portable executable, or modified copy of this project, you should also provide the corresponding source code and preserve the original copyright and license notices.

## What This Fork Adds

### Submission Management

Research Work adds an independent Submission Management module.

Submission records are stored separately from generated Wiki Markdown pages:

```text
.llm-wiki/submissions.json
```

The first version supports:

- one paper with multiple submissions
- journal / venue tracking
- manuscript ID
- submission date
- response deadline
- current round
- status filtering
- journal filtering
- sorting by submission date or response deadline
- status history events
- delete confirmation
- Chinese / English UI text

Submission statuses:

```text
preparing
submitted
under_review
minor_revision
major_revision
revised
accepted
rejected
withdrawn
```

Status changes append history events instead of silently overwriting the past.

### Idea Capture

Research Work adds a lightweight idea capture workflow.

Ideas are saved as Markdown pages under:

```text
wiki/ideas/
```

Idea pages use frontmatter:

```yaml
type: idea
title: Example Idea
created: 2026-07-20
updated: 2026-07-20
tags: []
```

Related knowledge is stored with ordinary Wiki links:

```markdown
## Related

[[wiki/sources/example-paper.md|Example Paper]]
[[wiki/entities/example-term.md|Example Term]]
```

This deliberately avoids a second graph database. The existing LLM Wiki graph can continue to infer links from Markdown.

### Quick Capture

Quick Capture provides a faster path for recording short thoughts without opening the full idea form.

It creates a Markdown idea page and can later be connected to papers, terms, or other Wiki knowledge.

### Bidirectional Knowledge Linking

The graph interaction has been extended so links can be managed from either side:

- right-click a paper / term / source node to connect or unlink ideas
- right-click an idea node to connect or unlink papers, terms, or other knowledge nodes
- opening a node detail can show linked ideas

The stored link still lives in the idea Markdown page, so the system remains compatible with the existing Wiki link model.

## What Remains from LLM Wiki

This fork preserves the original LLM Wiki architecture and major capabilities, including:

- Tauri desktop shell
- React + TypeScript frontend
- Markdown Wiki files
- source ingestion
- file tree
- search
- graph view
- review workflows
- LLM settings
- task queue
- local project persistence
- MCP server resources

The fork does not replace the original ingest, search, graph, review, or chat systems.

## Technology Stack

- Tauri
- React
- TypeScript
- Zustand
- Vite
- Rust
- Markdown
- JSON project persistence
- Vitest
- GitHub Actions

## Development

## PandaWiki knowledge-base chat (LAN V1)

When the PandaWiki provider is enabled, the provider settings panel can configure
an OpenAI-compatible **complete endpoint URL**, for example:

```text
https://wiki.example/share/v1/chat/completions
```

The model defaults to `knowledge-base`. The desktop client sends a standard
non-streaming OpenAI request with `messages` and `stream: false`; it never sends
`X-KB-ID`.

The PandaWiki **chat API token** is separate from the PandaWiki login session.
It is stored in Windows Credential Manager and is read only by the Rust desktop
layer, which also makes the HTTPS request. The token is never written to
`app-state.json`, returned to TypeScript, or logged.

For HTTPS to work, Windows must trust the issuing CA **and** the URL host or IP
must appear in the certificate's Subject Alternative Name. The application does
not disable TLS verification. A future proxy may use `/v1/chat/completions`; the
complete endpoint URL avoids any UI or application-layer change.

Install dependencies:

```bash
npm install
```

Run type checking:

```bash
npm run typecheck
```

Run mock-safe tests:

```bash
npm run test:mocks
```

Start the desktop app in development mode:

```bash
npm run tauri dev
```

Build the desktop application:

```bash
npm run tauri build
```

## GitHub Actions Builds

This repository includes a GitHub Actions workflow for desktop builds.

Branch builds upload workflow artifacts for testing.

Tag builds can publish release assets.

Expected artifacts may include:

- Windows installer
- Windows portable zip
- macOS DMG
- Linux packages

Unsigned macOS builds may trigger Gatekeeper warnings. A fully polished public macOS release would require proper signing and notarization.

## Important Scope Notes

This fork currently focuses on personal research workflow features.

It does not add:

- a new database
- cloud sync
- paid account infrastructure
- email monitoring
- automatic journal submission
- automatic revision generation
- a new graph engine
- a new RAG backend

## Modification Record

See [MODIFICATIONS.md](MODIFICATIONS.md) for a concise record of changes made in this fork.

## Notice

See [NOTICE](NOTICE) for attribution and redistribution notes.
