# PandaWiki Remote Capability Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present only verified PandaWiki capabilities in the existing LLM Wiki shell and guide a remote knowledge-base user to browsing, search, chat, plugins, and settings.

**Architecture:** PandaWiki virtual projects remain discriminated remote projects. The icon sidebar derives each visible action from `ProjectCapabilities`; a remote-only home view provides safe, direct navigation without importing local filesystem components. No unavailable API is represented as working.

**Tech Stack:** React, TypeScript, Zustand, Lucide, Vitest, Vite.

## Global Constraints

- Do not modify PandaWiki server code, documents, RAG permissions, or model configuration.
- Do not call local filesystem commands for PandaWiki projects.
- Only advertise remote functionality backed by a verified adapter: node tree/detail, search, chat, plugins, settings.
- Do not enable upload, node editing, server conversation history, graph, local review, lint, sources, or skills for PandaWiki projects.
- Use test-first development and preserve all local-project behavior.

---

### Task 1: Model the remote shell policy

**Files:**
- Modify: `src/lib/project-capabilities.ts`
- Modify: `src/lib/project-capabilities.test.ts`

- [ ] Add a failing test proving a PandaWiki project exposes only `wiki`, `search`, `chat`, `plugin`, and `settings` shell routes.
- [ ] Add `isRemoteShellView(project, view)` and use existing capability fields for route eligibility.
- [ ] Run `npx vitest run src/lib/project-capabilities.test.ts`.
- [ ] Commit the policy change.

### Task 2: Render an actionable remote home

**Files:**
- Modify: `src/components/layout/remote-project-home.tsx`
- Create: `src/components/layout/remote-project-home.test.tsx`

- [ ] Add a failing static-render test for browse, search, chat, plugins, and settings actions without local-file wording.
- [ ] Render five action cards that call the provided safe navigation callback.
- [ ] Run `npx vitest run src/components/layout/remote-project-home.test.tsx`.
- [ ] Commit the remote home change.

### Task 3: Apply the policy to the shell

**Files:**
- Modify: `src/components/layout/icon-sidebar.tsx`
- Modify: `src/components/layout/content-area.tsx`
- Test: existing capability and component tests

- [ ] Add a failing test proving remote projects do not render the local Skills action.
- [ ] Make `IconSidebar` derive supplemental actions from the remote shell policy.
- [ ] Pass a safe navigation callback from `ContentArea` to the remote home.
- [ ] Run focused tests, `npm run typecheck`, `npm run test:mocks`, and `npm run build`.
- [ ] Commit the shell integration.
