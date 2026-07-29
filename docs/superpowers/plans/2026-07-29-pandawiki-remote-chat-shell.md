# PandaWiki Remote Chat Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing, verified PandaWiki OpenAI-compatible chat adapter available from the original LLM Wiki chat and settings surfaces when a PandaWiki virtual project is selected.

**Architecture:** A PandaWiki virtual project advertises chat only because the existing Rust-backed conversation adapter is present. The remote chat view loads the already persisted endpoint configuration and delegates questions to the existing `PandaWikiAskPanel`; it never mounts the local `ChatPanel`, local agent tools, filesystem commands, or local conversation persistence. A small settings section exposes the existing endpoint/token configuration solely while a remote project is active.

**Tech Stack:** React, TypeScript, Zustand, Tauri Credential Manager commands, Vitest, Vite.

## Global Constraints

- Do not modify PandaWiki server code, RAG permissions, documents, or model configuration.
- Keep the chat API token outside TypeScript-readable persistence; only existing Tauri credential commands may write, clear, or check it.
- Send `stream: false` and never send `X-KB-ID`.
- Do not mount local `ChatPanel`, agent tools, local filesystem calls, or local chat history for PandaWiki projects.
- Do not implement server search, upload, node editing, SSE, server conversation history, or graph support in this change.

---

### Task 1: Advertise the verified remote chat capability

**Files:**
- Modify: `src/services/providers/pandawiki/PandaWikiVirtualProject.ts`
- Modify: `src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts`

- [ ] Write a failing assertion that a mapped PandaWiki virtual project has `chat: true` while `search`, `upload`, `conversationHistory`, `graph`, and `filesystem` remain false.
- [ ] Run `npx vitest run src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts` and confirm the assertion fails because chat is currently disabled.
- [ ] Set only `chat` to true in `PANDAWIKI_PROJECT_CAPABILITIES`.
- [ ] Re-run the focused test and commit the capability change.

### Task 2: Add a remote-only chat surface

**Files:**
- Create: `src/components/providers/panda-wiki-remote-chat.tsx`
- Create: `src/components/providers/panda-wiki-remote-chat.test.tsx`
- Modify: `src/components/layout/content-area.tsx`

- [ ] Write a failing render test proving a PandaWiki project chat route renders the remote chat surface rather than the local `ChatPanel`.
- [ ] Implement a remote chat surface that loads `PandaWikiChatConfig`, displays loading/configuration states, and renders `PandaWikiAskPanel` after configuration is loaded.
- [ ] Route only a PandaWiki project’s `chat` view to this surface; preserve local project routing to `ChatPanel`.
- [ ] Re-run the focused tests and commit the remote chat routing change.

### Task 3: Expose the existing secure chat configuration in remote settings

**Files:**
- Create: `src/components/settings/sections/pandawiki-chat-section.tsx`
- Modify: `src/components/settings/settings-view.tsx`
- Test: `src/services/providers/pandawiki/chat/PandaWikiChatConfig.test.ts`

- [ ] Add a failing test for the remote-settings availability predicate, which is false for local projects and true for PandaWiki projects.
- [ ] Implement a PandaWiki-only settings section that loads/saves endpoint/model/timeout using existing config functions and saves, clears, or checks a token only through `PandaWikiChatCredentialStore`.
- [ ] Show this section in Settings only while a PandaWiki virtual project is active.
- [ ] Re-run focused tests and commit the settings integration.

### Task 4: Verify the integration

**Files:**
- Modify only files required to fix test/type errors discovered above.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test:mocks`.
- [ ] Run `npm run build`.
- [ ] Launch the desktop development build and manually verify a PandaWiki project: settings can show saved chat configuration, chat renders the remote panel, a request uses the configured endpoint, and local project chat remains unchanged.

