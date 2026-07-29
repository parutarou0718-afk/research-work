# PandaWiki Remote Plugin Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make built-in plugins discoverable and persist their records safely for PandaWiki virtual projects without treating a remote knowledge base as a local filesystem directory.

**Architecture:** The plugin host will expose a discriminated local-or-remote project identity. Local projects retain their existing `.llm-wiki/plugins` files. PandaWiki projects use a dedicated application-data store, keyed by provider scope, plugin ID, and file name; no remote plugin API receives or invents local paths.

**Tech Stack:** React, TypeScript, Zustand, Tauri Store, Vitest.

## Global Constraints

- Do not send plugin records to PandaWiki in this increment.
- Do not create a filesystem path for a PandaWiki virtual project.
- Existing local plugin files and recovery behavior remain unchanged.
- Remote document selection stays unavailable until a DocumentProvider exists.

---

### Task 1: Expose the plugin library in primary navigation

**Files:**
- Modify: `src/components/layout/icon-sidebar.tsx`
- Modify: `src/components/layout/content-area.tsx`
- Test: `src/components/layout/icon-sidebar.test.tsx`

- [ ] Add a Puzzle navigation action that sets `activeView` to `plugin` and clears the selected plugin route.
- [ ] Render `PluginsSection` when `activeView === "plugin"` and no individual plugin route is selected.
- [ ] Verify the direct entry remains visible for local and PandaWiki projects.

### Task 2: Add remote plugin storage dispatch

**Files:**
- Modify: `src/core/plugins/host/types.ts`
- Modify: `src/core/plugins/host/PluginHost.ts`
- Create: `src/core/plugins/host/RemotePluginStore.ts`
- Test: `src/core/plugins/host/PluginHost.test.ts`

- [ ] Define `LocalPluginProject` and `PandaWikiPluginProject` as a discriminated union.
- [ ] Keep local storage paths exactly unchanged.
- [ ] Persist remote JSON under `pandawiki:{scopeKey}:plugins:{pluginId}:{fileName}` through a Tauri application-data store.
- [ ] Reject remote document reads rather than calling Tauri filesystem commands.

### Task 3: Make submission management safe for a remote project

**Files:**
- Modify: `src/plugins/submission-management/components/submissions-view.tsx`
- Test: `src/plugins/submission-management/components/submissions-view.test.tsx`

- [ ] Allow manual submission records for remote projects.
- [ ] Show no local document picker options for a PandaWiki project until a DocumentProvider is connected.
- [ ] Verify switching project scope reloads only that scope's records.
