# Plugin SDK v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide stable, scoped core APIs to official plugins and migrate submission management to use them.

**Architecture:** `PluginHost` is created by core and passed into plugin factories and plugin pages. Core owns project/document adapters and namespaced storage; plugins own business behavior, data schema and UI.

**Tech Stack:** React, TypeScript, Zustand, Tauri filesystem commands, Vitest, Vite.

## Global Constraints

- Do not change PandaWiki Provider, chat/token/Credential Manager, Rust/Tauri, Docker, TLS or backend code.
- Do not add EventBus, direct SQLite access, arbitrary command execution or AI APIs.
- Do not delete plugin data when disabling a plugin.
- Preserve legacy `.llm-wiki/submissions.json` through read-only migration compatibility.

---

### Task 1: Define and test the scoped PluginHost contracts

**Files:**
- Create: `src/core/plugins/host/types.ts`
- Create: `src/core/plugins/host/PluginHost.ts`
- Test: `src/core/plugins/host/PluginHost.test.ts`
- Modify: `src/core/plugins/types.ts`
- Modify: `src/core/plugins/PluginProvider.tsx`

- [x] Write failing tests for namespaced settings, storage paths and project/document adapters.
- [x] Define `PluginHost`, page props and factory plugin definition types.
- [x] Build the host from existing core project state and filesystem commands.
- [x] Pass one Host instance to all built-in plugin factories and pages.

### Task 2: Migrate plugin persistence and submission integration

**Files:**
- Modify: `src/plugins/submission-management/index.ts`
- Modify: `src/plugins/submission-management/SubmissionManagementPage.tsx`
- Modify: `src/plugins/submission-management/persistence/submission-persist.ts`
- Modify: `src/plugins/submission-management/store/submission-store.ts`
- Modify: `src/plugins/submission-management/components/submissions-view.tsx`
- Modify: `src/plugins/submission-management/components/paper-options.ts`
- Test: plugin persistence and Store tests

- [x] Write failing tests for namespaced storage and legacy submission import.
- [x] Move persistence to `PluginStorage` and retain the version-1 schema.
- [x] Replace direct core Store/filesystem imports with Host methods.
- [x] Preserve recovery, disable and project-switch safety behavior.

### Task 3: Publish capability audit and validate

**Files:**
- Create: `docs/pandawiki-client-capability-audit.md`
- Modify: SDK design and plan documents

- [x] Record verified versus declared PandaWiki client capabilities.
- [x] Run targeted tests, full Mock tests, typecheck and production build.
- [x] Verify no forbidden integration area changed.
- [x] Commit as `feat(plugin-sdk): add scoped plugin host APIs`.
