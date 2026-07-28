# Submission Management Plugin Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move submission management fully into the official built-in plugin while preserving existing project data and adding opt-in recovery after re-enabling.

**Architecture:** Core plugin infrastructure owns only generic enablement and recovery-decision state. The submission plugin owns its domain, storage, Zustand store and UI, and retains the existing project-local JSON format.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Vite, localStorage, Tauri filesystem commands.

## Global Constraints

- Do not modify PandaWiki Provider, chat/token/Credential Manager, Rust/Tauri, database, Docker or TLS code.
- Disable means hide plus clear runtime state; it never deletes plugin data.
- Keep `.llm-wiki/submissions.json` and its version-1 schema compatible.
- The core must not import submission domain, persistence or store code after migration.

---

### Task 1: Add generic plugin data-recovery contract and tests

**Files:**
- Modify: `src/core/plugins/types.ts`
- Modify: `src/core/plugins/PluginProvider.tsx`
- Modify: `src/core/plugins/usePlugins.ts`
- Test: `src/core/plugins/PluginRegistry.test.ts`

- [x] Add a failing Provider-level behavior test for a plugin that reports historical data: enabling it creates a recovery decision instead of auto-restoring.
- [x] Add the minimal generic `PluginDataRecovery` contract and Provider state/actions for `restore` and `defer`.
- [x] Verify disable clears runtime data through the plugin lifecycle and does not change persisted enablement semantics.

### Task 2: Move all submission implementation into the plugin

**Files:**
- Create: `src/plugins/submission-management/domain/submission.ts`
- Create: `src/plugins/submission-management/store/submission-store.ts`
- Create: `src/plugins/submission-management/persistence/submission-persist.ts`
- Create: `src/plugins/submission-management/components/*`
- Move tests alongside their implementation under `src/plugins/submission-management/`
- Delete: `src/types/submission.ts`, `src/stores/submission-store.ts`, `src/lib/submission-persist.ts`, `src/components/submissions/*`

- [x] Move files without changing public submission behavior or storage JSON.
- [x] Add a failing recovery test proving historical data is detected without reading it into the store.
- [x] Implement the plugin recovery adapter and page gating; restore calls hydrate, defer keeps historical data protected from writes.
- [x] Run moved unit tests and confirm existing JSON compatibility tests pass.

### Task 3: Remove direct core integration and add recovery UI

**Files:**
- Modify: `src/components/layout/icon-sidebar.tsx`
- Modify: `src/components/layout/content-area.tsx`
- Modify: `src/components/layout/research-panel-nav.ts`
- Modify: `src/stores/wiki-store.ts`
- Modify: `src/lib/reset-project-state.ts`
- Modify: `src/components/settings/sections/plugins-section.tsx`
- Modify: `src/plugins/submission-management/index.ts`
- Test: `src/core/plugins/builtinPlugins.test.ts`

- [x] Remove `submissions` from the core navigation, view union, content switch and reset dependencies.
- [x] Register the full plugin page and generic recovery capability.
- [x] Render a generic confirmation UI in settings and an in-plugin recovery state when navigation occurs before a choice.
- [x] Verify the plugin disappears when disabled, returns when enabled, and only restores data after an explicit choice.

### Task 4: Validate and commit

**Files:**
- Modify: `docs/superpowers/specs/2026-07-28-submission-management-plugin-migration-design.md`
- Modify: `docs/superpowers/plans/2026-07-28-submission-management-plugin-migration.md`

- [x] Run targeted plugin and submission tests.
- [x] Run `npm run typecheck`, `npm run test:mocks`, and `npm run build`.
- [x] Confirm the diff contains no prohibited integration areas.
- [x] Commit as `refactor(plugin-system): move submission management into official plugin`.
