# PandaWiki Virtual Project Integration Design

Date: 2026-07-29

## Objective

Keep the existing LLM Wiki interface as the only desktop frontend while using PandaWiki as the remote knowledge and AI backend. A PandaWiki knowledge base is represented inside LLM Wiki as a virtual project. Connecting to PandaWiki must not replace the existing application shell with a separate workspace.

## Current Problem

The current PandaWiki integration branches at the top of `App.tsx` after login and renders `PandaWikiWorkspace` instead of the normal `AppLayout`. This makes the integration usable for basic knowledge browsing and chat, but hides the established LLM Wiki navigation, settings, plugin management, and plugin pages.

This is an architectural mismatch. `PandaWikiWorkspace` must not become a second product UI. PandaWiki-specific code should supply data and capabilities to the existing LLM Wiki UI through Provider boundaries.

## Chosen Architecture

### Knowledge base as virtual project

Each PandaWiki knowledge base is mapped to a `PandaWikiVirtualProject` compatible with the existing project selection and workspace lifecycle.

The virtual project has a stable identity derived from the PandaWiki connection and knowledge-base ID. It carries explicit remote metadata and must not pretend that it owns a local filesystem directory.

Conceptually:

```text
PandaWiki knowledge base
  -> PandaWikiVirtualProject
  -> existing LLM Wiki AppLayout
  -> Provider-aware stores and commands
```

Selecting another PandaWiki knowledge base follows the existing project-switching experience. The switch cancels outstanding remote requests and clears provider-scoped node, search, and chat state before loading the new knowledge base.

### One application shell

After authentication, the application displays the existing project selection and `AppLayout`. The following remain available:

- primary navigation and content layout;
- settings, including the feature-module page;
- plugin navigation and plugin pages;
- editor/reader locations;
- search and chat locations;
- local utility features that are valid for remote projects.

`PandaWikiWorkspace` will be decomposed or reduced to reusable remote-data components. It will no longer be returned as the top-level authenticated application.

### Provider boundaries

UI components and stores consume domain models and capability interfaces. PandaWiki DTOs remain inside the PandaWiki adapter and always pass through mappers.

The first integration uses these capabilities:

- authentication: PandaWiki management login;
- knowledge: knowledge-base list, node tree, and node detail;
- search: authenticated, server-filtered knowledge-base search;
- conversation: OpenAI-compatible PandaWiki knowledge-base chat;

Unsupported capabilities remain explicitly unavailable. The application must not silently fall back to local storage, local search, or a local model when a PandaWiki operation fails.

### Configuration and credentials

Management and chat endpoints remain separate:

```text
managementBaseUrl
chatCompletionUrl
```

The management login credential/session and the Chat API token remain separate. The Chat API token stays in Windows Credential Manager and is never returned to TypeScript. No token is stored in normal project or application JSON.

## Data Mapping

### Project

The internal project model gains an explicit source discriminator, for example:

```ts
type ProjectSource = "local" | "pandawiki"
```

A PandaWiki virtual project contains at least:

- stable virtual-project ID;
- knowledge-base ID and name;
- PandaWiki connection identity;
- source type `pandawiki`;
- provider capability snapshot.

Code requiring a real filesystem path must check project source first. A synthetic path must not be passed to Tauri filesystem commands.

### Files and nodes

PandaWiki nodes map to the existing file-tree domain model through the PandaWiki mapper. Selecting a remote tree item loads node detail through `KnowledgeProvider.getNode` and renders the returned content in the established content area.

Remote nodes keep their PandaWiki node IDs as source identifiers. They are not copied into local Markdown files during V1.

### Search

The existing search location calls the PandaWiki Search Provider for remote projects. Authorization and `group_ids` filtering occur on the PandaWiki server. The client never submits trusted permission groups and never performs security filtering after receiving broader results.

Search results map to an internal result model and open the corresponding remote node through the same node-detail path.

### Conversation

For a PandaWiki virtual project, the knowledge-base question action calls the PandaWiki Conversation Provider with `stream: false` in V1. It uses the separately stored Chat API token and does not send `X-KB-ID` for a single-knowledge-base token.

The existing local-project chat behavior remains unchanged. Provider selection is determined by project source, not by transparent error fallback.

## Plugin Behavior

The official plugin system remains part of the normal `AppLayout` and therefore remains visible for PandaWiki virtual projects.

The first built-in plugin is submission management. It remains disabled by default and can be enabled from:

```text
Settings -> Feature modules
```

Plugin configuration remains local to the desktop application. Plugin data remains namespaced under the plugin storage contract and survives disable/enable cycles.

Plugins must use `PluginHost` APIs rather than importing PandaWiki DTOs, Provider internals, Zustand stores, routing internals, or Tauri filesystem functions directly.

For a remote project, plugin storage uses a stable local application-data location keyed by connection ID and knowledge-base ID. It must not require a nonexistent remote project filesystem path. Disabling a plugin hides its UI and clears runtime state without deleting retained plugin records. On re-enable, historical data recovery remains an explicit user decision.

## Capability and UI Rules

Capabilities represent working adapters, not planned features. V1 behavior is:

| Capability | PandaWiki virtual project behavior |
| --- | --- |
| Login | Available |
| Knowledge-base selection | Available |
| Node tree and detail | Available |
| Knowledge chat | Available, non-streaming |
| Authenticated search | Available after verified backend deployment |
| Plugin settings and submission plugin | Available |
| Remote upload | Unavailable in this correction phase |
| Remote node editing | Unavailable in this correction phase |
| Conversation history | Unavailable in this correction phase |
| SSE chat | Unavailable in this correction phase |
| Graph/entity relations | Unavailable in this correction phase |

Unavailable actions are hidden or disabled with a clear explanation. They must not invoke local operations against remote content.

## Error Handling

Provider failures are mapped into safe domain-level error categories. Authentication expiration returns to the PandaWiki login flow. Permission errors remain distinct from missing resources. Search and chat failures do not unload the selected knowledge base or damage plugin data.

No logs may contain passwords, authorization headers, login tokens, Chat API tokens, full prompts, or protected document contents.

## First Correction Scope

The first implementation restores one coherent user flow:

1. authenticate with PandaWiki;
2. choose a PandaWiki knowledge base using the existing project-selection experience;
3. enter the existing `AppLayout`;
4. browse the remote node tree and read node content;
5. search through the authenticated PandaWiki Search Provider;
6. ask a knowledge-base question through the PandaWiki Conversation Provider;
7. open Settings and enable the submission-management plugin;
8. use the plugin page without losing data when the plugin is disabled and enabled again.

The correction does not add upload, remote editing, server conversation history, SSE, graph support, or a new plugin SDK abstraction.

## Testing Strategy

Automated coverage must verify:

- authenticated PandaWiki mode renders the existing `AppLayout`, not a replacement workspace;
- knowledge bases map to stable virtual projects;
- virtual projects never reach filesystem-only commands;
- project switching clears provider-scoped state and reloads the selected knowledge base;
- node tree/detail use the PandaWiki Knowledge Provider;
- search uses the authenticated Search Provider and does not submit client-supplied permission groups;
- chat uses the PandaWiki Conversation Provider, `stream: false`, and no `X-KB-ID`;
- plugin settings remain reachable in PandaWiki mode;
- enabling submission management adds its navigation item;
- disabling the plugin hides it without deleting retained data;
- local-project behavior remains unchanged;
- authentication, permission, timeout, malformed-response, and unavailable-capability states remain distinct.

Manual acceptance uses a real LAN PandaWiki deployment and confirms login, knowledge-base selection, node reading, search-to-node navigation, unique-fact chat, plugin enablement, and submission-data recovery.

## Migration and Compatibility

Existing locally saved projects remain valid. Existing PandaWiki connection and Chat credential storage remain valid. If the previous standalone PandaWiki workspace stored UI-only selection state, it can be ignored; no knowledge-base or server data migration is required.

The existing `PandaWikiWorkspace` is retained temporarily only as a source of tested components while its responsibilities are moved behind the normal application shell. It is not a supported parallel UI after the correction is complete.

## Success Criteria

The correction is complete when the distributed LLM Wiki application presents its original UI after PandaWiki login, represents PandaWiki knowledge bases as selectable virtual projects, keeps plugin management available, and performs supported remote operations exclusively through verified Provider adapters without duplicating server knowledge locally.
