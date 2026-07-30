# Industry Workspace Suites V0.1 Design

## Goal

Ship three preinstalled, visible industry workspaces in the existing LLM Wiki desktop shell: Research, Legal, and Investment Research.  Each workspace keeps the global sidebar uncluttered by exposing its functions through an inner menu.

## Scope

This release is an investor-demo surface.  It reuses the existing local/remote project model, plugin host, PandaWiki knowledge navigation, authenticated search, graph, and remote chat.  It does not copy PandaWiki documents, build a second local index, or add a new Plugin SDK.

## User flow

1. The global sidebar exposes one `Workspaces` entry, alongside the existing Plugin Library.
2. Opening it shows three installed suites, all visible without feature gating:
   - Research Workspace
   - Legal Workspace
   - Investment Research Workspace
3. Selecting a suite opens a shared workspace shell with a suite-specific inner menu.  Selecting an inner item changes only the content area; it does not create more global sidebar icons.
4. Every suite works with both local and PandaWiki virtual projects.  A PandaWiki project uses its existing server adapters and never invokes filesystem, local indexing, or local graph-analysis code.

## Suite contents

### Research Workspace

- Overview: direct cards for documents, search, knowledge graph, and server chat.
- Submissions: routes to the existing Submission Management plugin.  Its existing remote-project storage policy remains unchanged.
- Literature graph: routes to the existing graph surface and uses server graph data for PandaWiki projects.

### Legal Workspace

- Matter overview: a filtered, read-only view of server graph entities whose types are configured by the server schema.
- Evidence timeline: a generic timeline grouped by a configured date attribute.  It remains empty with an actionable explanation until the administrator configures a date field and rebuilds the graph.
- Knowledge graph and legal research: routes to the current graph, authenticated search, and remote chat surfaces.

### Investment Research Workspace

- Company overview: a filtered, read-only graph-entity list based on server-defined entity types.
- Risk board: a generic board grouping graph entities by a configured select/text attribute such as `risk_level`.  It remains empty with an actionable explanation until the server schema exposes the field.
- Knowledge graph, search, and analysis chat: route to the existing server-backed surfaces.

## Architecture

`industry-workspaces` is one official, built-in plugin registered through the existing PluginRegistry.  It owns only suite descriptors, workspace navigation state, and views composed from existing providers.  It does not access Zustand internals, Tauri filesystem commands, PandaWiki DTOs, or credentials.

The workspace receives the active project from the existing PluginHost.  Provider-backed components retrieve data through the existing `GraphProvider`, `KnowledgeProvider`, `SearchProvider`, and chat surface.  Pure helper functions receive already mapped domain models, so they can be tested without HTTP, Tauri, or React rendering.

For remote projects, server graph schema is authoritative.  A suite may request only already-returned, permission-filtered graph data.  The UI does not send `group_ids`, select a different knowledge base, or infer permissions locally.

## Data and capability rules

- All three suites are preinstalled and `defaultEnabled: true`.
- The plugin’s only global navigation item is `Workspaces`.
- Inner menu items derive their availability from the active project’s existing capabilities.
- A remote project may show Documents/Search/Graph/Chat links only when the corresponding capability is enabled.
- Schema-defined entity type and attribute keys are treated as display/filter inputs only.  Unknown, missing, or empty fields result in an empty-state message, not fabricated data.
- Local projects retain existing local UI behavior.  No remote request silently falls back to a local analysis path, and no local request silently falls back to PandaWiki.

## Error and empty states

- No active project: request that the user choose a project.
- Provider capability unavailable: explain that the connection or server feature is unavailable and hide the action.
- Graph unavailable or empty: explain that the server administrator must configure/rebuild the graph; do not create local graph data.
- Network/authorization errors remain surfaced by the existing provider components; workspace cards do not swallow or replace them.

## Testing

Unit tests cover suite registration, global/inner navigation descriptors, capability-based item visibility, graph entity filtering, timeline ordering, and risk-board grouping.  Component tests cover selecting a suite, opening its inner menu, routing an action to the existing active view, and remote-project empty states.  Existing mock tests and TypeScript checking must continue to pass.

## Explicit exclusions

- No new backend endpoints or migrations.
- No local embeddings, local vector database, document synchronization, or duplicate graph extraction.
- No legal case database, financial calculation engine, Word/PDF export, workflow engine, or new AI agent.
- No rework of the existing submission domain or plugin persistence.
