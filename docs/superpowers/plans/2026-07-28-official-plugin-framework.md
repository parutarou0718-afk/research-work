# Official Plugin Framework v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an official built-in plugin registry, enablement state, lifecycle, navigation extension, settings toggle, and submission-management placeholder.

**Architecture:** A small registry persists enabled official plugins in localStorage. React consumes it through a context provider. Existing sidebar and content routing gain one generic plugin extension point; they do not import submission business code.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, localStorage.

## Global Constraints

- Do not modify PandaWiki Provider, chat, Token/Credential Manager, Rust/Tauri, Docker/TLS, SQLite, or existing submission business code.
- Only official built-in plugins are supported; no remote code, marketplace, download, permissions, or database migration.
- Plugin failure must not block core startup.

### Task 1: Registry contracts and tests

**Files:**
- Create: `src/core/plugins/types.ts`
- Create: `src/core/plugins/PluginRegistry.ts`
- Create: `src/core/plugins/PluginRegistry.test.ts`

- [ ] Write failing tests for duplicate rejection, default disabled state, persisted enablement, activation/deactivation, and lifecycle-error isolation.
- [ ] Implement focused plugin contracts and registry.
- [ ] Run `npm run test:mocks -- src/core/plugins/PluginRegistry.test.ts`.

### Task 2: React provider and built-in plugin

**Files:**
- Create: `src/core/plugins/PluginProvider.tsx`
- Create: `src/core/plugins/usePlugins.ts`
- Create: `src/core/plugins/builtinPlugins.ts`
- Create: `src/plugins/submission-management/manifest.ts`
- Create: `src/plugins/submission-management/index.ts`
- Create: `src/plugins/submission-management/SubmissionPlaceholderPage.tsx`

- [ ] Register built-ins at application startup through the provider.
- [ ] Expose plugin state and lifecycle methods to React.
- [ ] Add the disabled-by-default submission placeholder plugin.

### Task 3: Navigation, content, and settings extension

**Files:**
- Modify: `src/stores/wiki-store.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/icon-sidebar.tsx`
- Modify: `src/components/layout/content-area.tsx`
- Create: `src/components/settings/sections/plugins-section.tsx`
- Modify: `src/components/settings/settings-view.tsx`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/zh.json`

- [ ] Add a generic plugin active view and selected route.
- [ ] Render only enabled plugin navigation after the existing navigation.
- [ ] Render plugin pages through one generic content branch.
- [ ] Add a small Feature modules settings section using existing controls.

### Task 4: Verification and handoff

**Files:**
- Modify: `docs/superpowers/specs/2026-07-28-official-plugin-framework-design.md`
- Modify: `docs/superpowers/plans/2026-07-28-official-plugin-framework.md`

- [ ] Run targeted plugin tests.
- [ ] Run `npm run test:mocks`, `npm run typecheck`, and `npm run build`.
- [ ] Inspect `git diff` to ensure prohibited areas remain untouched.
- [ ] Commit only framework, placeholder, tests, and docs with `feat(plugin-system): add official plugin framework v0.1`.
