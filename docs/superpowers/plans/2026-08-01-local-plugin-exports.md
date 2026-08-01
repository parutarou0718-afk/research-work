# Local Plugin Exports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep plugin records local for local and PandaWiki projects and export plugin results as Markdown, JSON, DOCX, and PDF.

**Architecture:** PandaWiki remains a provider-only read source. The plugin host stores remote project data in the existing device store under a connection-and-KB scope key. Each plugin creates a common export model; TypeScript renders Markdown and JSON while Tauri writes DOCX and PDF to a user-approved local destination.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Tauri 2, Rust, docx-rs, native PDF writer.

## Global Constraints

- Do not write plugin records, analysis results, or export preferences to PandaWiki.
- Do not synchronize complete PandaWiki document bodies into local plugin storage.
- Keep local project behavior unchanged.
- Every user-selected export target must be an absolute local path.

---

### Task 1: Restore local plugin persistence for remote projects

**Files:** `src/plugins/submission-management/persistence/submission-persist.ts`, `src/plugins/submission-management/persistence/submission-persist.test.ts`.

- [ ] Write a failing test proving PandaWiki project submission persistence does not call `PluginHost.records`.
- [ ] Run `npx vitest run src/plugins/submission-management/persistence/submission-persist.test.ts`; confirm failure.
- [ ] Use the local `PluginStorage` path for every project source; preserve remote scope isolation in `PluginHost`.
- [ ] Re-run the test and commit only the persistence files.

### Task 2: Shared plugin export model

**Files:** `src/core/plugins/export/types.ts`, `src/core/plugins/export/render.ts`, `src/core/plugins/export/render.test.ts`.

- [ ] Write failing tests for Markdown and JSON containing only selected plugin data and stable reference locators.
- [ ] Implement `PluginExportModel`, `renderPluginExportMarkdown`, and `renderPluginExportJson`.
- [ ] Re-run the focused tests and commit the renderer.

### Task 3: Export settings and native writers

**Files:** `src/core/plugins/export/preferences.ts`, `src/core/plugins/export/preferences.test.ts`, `src/commands/plugin-export.ts`, `src-tauri/src/plugin_export.rs`, `src-tauri/src/lib.rs`, `src-tauri/Cargo.toml`.

- [ ] Write failing tests for default export-directory/format normalization and Rust DOCX/PDF output.
- [ ] Persist only local export preferences.
- [ ] Implement guarded Tauri writers for DOCX and PDF and invoke them from TypeScript.
- [ ] Re-run Vitest and `cargo test` and commit this layer.

### Task 4: Submission export UI

**Files:** `src/plugins/submission-management/export/submission-export.ts`, `src/plugins/submission-management/export/submission-export.test.ts`, `src/plugins/submission-management/components/submissions-view.tsx`, relevant settings components, `src/i18n/en.json`, `src/i18n/zh.json`.

- [ ] Write failing tests for the submission-to-export-model adapter.
- [ ] Add settings for default directory and formats plus an export action that lets the user override both.
- [ ] Add Markdown, JSON, DOCX, and PDF export choices to the submission plugin.
- [ ] Run `npm run test:mocks`, `npm run typecheck`, `cargo test`, and `cargo check` before final commit.
