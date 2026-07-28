# PandaWiki Virtual Project Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After PandaWiki authentication, represent each PandaWiki knowledge base as a virtual project and render it inside the existing LLM Wiki `AppLayout` without allowing remote projects to enter local filesystem operations.

**Architecture:** Replace the single path-based project shape with a discriminated `LocalProject | PandaWikiVirtualProject` union. Keep connection/session state in a focused PandaWiki workspace store, map knowledge bases to stable virtual project identities, and route application startup and project selection through the existing shell. Local-only UI and effects are guarded by explicit project capabilities; no fake filesystem path or transparent fallback is introduced.

**Tech Stack:** React 19, TypeScript 5.7, Zustand 5, Vitest 4, Tauri 2, existing PandaWiki Provider contracts.

## Global Constraints

- Stable remote project IDs use exactly `pandawiki:${connectionId}:${knowledgeBaseId}`.
- `Project` is a discriminated union; `PandaWikiVirtualProject` has no `path` property.
- Capability values describe working adapters, not planned features.
- PandaWiki v0.2 capabilities are `readKnowledge/search/chat=true` and `editNode/upload/conversationHistory/graph/filesystem=false`.
- Provider-scoped async work uses both `AbortController` and a `scopeKey` equality check before committing results.
- PandaWiki authentication must lead to the original `AppLayout`; `PandaWikiWorkspace` must not remain a top-level product shell.
- Remote failures never fall back to local files, local search, or a local model.
- Existing local project behavior must remain unchanged.
- This phase does not add remote editing, upload, SSE, server conversation history, graph support, or a new plugin SDK abstraction.

---

## File Structure

**Create**

- `src/domain/projects.ts` — discriminated project union, capabilities, narrowing helpers, stable identity helpers.
- `src/domain/projects.test.ts` — identity, capability, and narrowing tests.
- `src/services/providers/pandawiki/PandaWikiVirtualProject.ts` — maps `KnowledgeModel` plus connection identity to a virtual project.
- `src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts` — mapping and cross-server collision tests.
- `src/stores/pandawiki-workspace-store.ts` — authenticated connection, virtual project list, active scope, and request generation state.
- `src/stores/pandawiki-workspace-store.test.ts` — project-switch and stale-response isolation tests.
- `src/components/project/pandawiki-project-list.tsx` — remote knowledge-base choices rendered in the existing project-selection screen.
- `src/components/project/pandawiki-project-list.test.tsx` — selection and empty/error UI tests.
- `src/components/layout/remote-project-home.tsx` — V1 remote-project center content used until Phase 2 replaces it with node reading.
- `src/lib/project-capabilities.ts` — view/action availability derived only from active project capabilities.
- `src/lib/project-capabilities.test.ts` — local/remote action matrix.

**Modify**

- `src/types/wiki.ts` — re-export the new project domain types; remove the old path-only `WikiProject` declaration.
- `src/App.tsx` — remove top-level `PandaWikiWorkspace` rendering; authenticate, list KBs, select virtual project, and render `AppLayout`.
- `src/components/project/welcome-screen.tsx` — display local recent projects and PandaWiki virtual projects as distinct project sources.
- `src/components/layout/app-layout.tsx` — load the local file tree only for local projects; keep the shell mounted for remote projects.
- `src/components/layout/sidebar-panel.tsx` — select remote-safe sidebar content instead of local file operations.
- `src/components/layout/content-area.tsx` — keep Settings and plugin pages available; show the remote home for local-only views in this phase.
- `src/components/layout/icon-sidebar.tsx` — hide or disable unsupported remote actions from the capability matrix.
- `src/core/plugins/host/types.ts` — expose discriminated project identity without requiring `path`.
- `src/core/plugins/host/PluginHost.ts` — use project ID/source for subscription and reject filesystem-backed plugin storage for remote projects with a typed error until the remote storage task lands.
- `src/core/plugins/host/PluginHost.test.ts` — verify no Tauri filesystem method is called for a remote project.
- `src/stores/wiki-store.ts` — store the project union and clear source-specific view state on source changes.
- `src/config/providers.json` — no data change; use the existing PandaWiki connection as the `connectionId` source.
- `src/i18n/en.json` — remote project/source labels and unsupported-action messages.
- `src/i18n/zh.json` — matching Chinese labels and messages.

**Retain without top-level use**

- `src/components/providers/panda-wiki-workspace.tsx` — remains temporarily as tested component source but is no longer rendered by `App.tsx`.

---

### Task 1: Define the Discriminated Project Domain

**Files:**
- Create: `src/domain/projects.ts`
- Create: `src/domain/projects.test.ts`
- Modify: `src/types/wiki.ts:1-7`

**Interfaces:**
- Produces: `Project`, `LocalProject`, `PandaWikiVirtualProject`, `ProjectCapabilities`, `ProviderScopeKey`, `isLocalProject`, `isPandaWikiProject`, `requireLocalProject`, `buildPandaWikiProjectId`, and `buildProviderScopeKey`.
- Consumes: no Provider DTOs and no React/Tauri APIs.

- [ ] **Step 1: Write failing domain tests**

```ts
import { describe, expect, it } from "vitest"
import {
  buildPandaWikiProjectId,
  buildProviderScopeKey,
  isLocalProject,
  requireLocalProject,
  UnsupportedProjectOperationError,
  type PandaWikiVirtualProject,
} from "./projects"

describe("project domain", () => {
  it("includes the connection in a PandaWiki virtual-project id", () => {
    expect(buildPandaWikiProjectId("server-a", "kb-1"))
      .toBe("pandawiki:server-a:kb-1")
    expect(buildPandaWikiProjectId("server-b", "kb-1"))
      .not.toBe(buildPandaWikiProjectId("server-a", "kb-1"))
  })

  it("uses connection and knowledge-base identity for request scope", () => {
    expect(buildProviderScopeKey("server-a", "kb-1")).toBe("server-a:kb-1")
  })

  it("rejects a remote project before any filesystem operation", () => {
    const remote: PandaWikiVirtualProject = {
      id: "pandawiki:server-a:kb-1",
      source: "pandawiki",
      name: "Legal KB",
      connectionId: "server-a",
      knowledgeBaseId: "kb-1",
      scopeKey: "server-a:kb-1",
      capabilities: {
        readKnowledge: true, search: true, chat: true,
        editNode: false, upload: false, conversationHistory: false,
        graph: false, filesystem: false,
      },
    }
    expect(isLocalProject(remote)).toBe(false)
    expect(() => requireLocalProject(remote, "open project folder"))
      .toThrow(UnsupportedProjectOperationError)
  })
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run src/domain/projects.test.ts`

Expected: FAIL because `src/domain/projects.ts` does not exist.

- [ ] **Step 3: Implement the project types and helpers**

```ts
export interface ProjectCapabilities {
  readKnowledge: boolean
  search: boolean
  chat: boolean
  editNode: boolean
  upload: boolean
  conversationHistory: boolean
  graph: boolean
  filesystem: boolean
}

export interface LocalProject {
  id: string
  source: "local"
  name: string
  path: string
  capabilities: ProjectCapabilities
}

export type ProviderScopeKey = `${string}:${string}`

export interface PandaWikiVirtualProject {
  id: `pandawiki:${string}:${string}`
  source: "pandawiki"
  name: string
  connectionId: string
  knowledgeBaseId: string
  scopeKey: ProviderScopeKey
  capabilities: ProjectCapabilities
}

export type Project = LocalProject | PandaWikiVirtualProject
export type WikiProject = Project

export class UnsupportedProjectOperationError extends Error {
  constructor(readonly operation: string, readonly source: Project["source"]) {
    super(`${operation} is unavailable for ${source} projects.`)
    this.name = "UnsupportedProjectOperationError"
  }
}

export function buildPandaWikiProjectId(connectionId: string, knowledgeBaseId: string) {
  return `pandawiki:${connectionId}:${knowledgeBaseId}` as const
}

export function buildProviderScopeKey(connectionId: string, knowledgeBaseId: string) {
  return `${connectionId}:${knowledgeBaseId}` as ProviderScopeKey
}

export function isLocalProject(project: Project): project is LocalProject {
  return project.source === "local"
}

export function isPandaWikiProject(project: Project): project is PandaWikiVirtualProject {
  return project.source === "pandawiki"
}

export function requireLocalProject(project: Project, operation: string): LocalProject {
  if (!isLocalProject(project)) throw new UnsupportedProjectOperationError(operation, project.source)
  return project
}
```

Move the old `WikiProject` export in `src/types/wiki.ts` to a type re-export:

```ts
export type {
  LocalProject,
  PandaWikiVirtualProject,
  Project,
  ProjectCapabilities,
  ProviderScopeKey,
  WikiProject,
} from "@/domain/projects"
```

When adapting existing local project constructors in this task, add `source: "local"` and the full local capability object; do not add `path` to the remote type.

- [ ] **Step 4: Run tests and typecheck to enumerate all required narrowing sites**

Run: `npx vitest run src/domain/projects.test.ts && npm run typecheck`

Expected: domain test PASS; typecheck lists existing local-only call sites that require narrowing in Task 5.

- [ ] **Step 5: Commit the domain boundary**

```powershell
git add src/domain/projects.ts src/domain/projects.test.ts src/types/wiki.ts src/commands/fs.ts
git commit -m "refactor: define local and PandaWiki project types"
```

---

### Task 2: Map Knowledge Bases to Stable Virtual Projects

**Files:**
- Create: `src/services/providers/pandawiki/PandaWikiVirtualProject.ts`
- Create: `src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts`
- Modify: `src/services/providers/pandawiki/capabilities.ts`

**Interfaces:**
- Consumes: `KnowledgeModel`, `PandaWikiVirtualProject`, `buildPandaWikiProjectId`, `buildProviderScopeKey`.
- Produces: `mapKnowledgeBaseToVirtualProject(connectionId, knowledgeBase)` and `PANDAWIKI_PROJECT_CAPABILITIES`.

- [ ] **Step 1: Write the failing mapper test**

```ts
import { describe, expect, it } from "vitest"
import { mapKnowledgeBaseToVirtualProject } from "./PandaWikiVirtualProject"

describe("PandaWiki virtual projects", () => {
  it("maps a knowledge base without manufacturing a filesystem path", () => {
    const project = mapKnowledgeBaseToVirtualProject("lan-prod", {
      id: "kb-1", name: "Research", datasetId: "dataset-1",
      createdAt: "2026-07-29T00:00:00Z", updatedAt: "2026-07-29T00:00:00Z",
    })
    expect(project).toMatchObject({
      id: "pandawiki:lan-prod:kb-1",
      source: "pandawiki",
      knowledgeBaseId: "kb-1",
      scopeKey: "lan-prod:kb-1",
      capabilities: { filesystem: false, readKnowledge: true, search: true, chat: true },
    })
    expect("path" in project).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npx vitest run src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts`

Expected: FAIL because the mapper does not exist.

- [ ] **Step 3: Implement the mapper and capability constant**

```ts
export const PANDAWIKI_PROJECT_CAPABILITIES: ProjectCapabilities = {
  readKnowledge: true,
  search: true,
  chat: true,
  editNode: false,
  upload: false,
  conversationHistory: false,
  graph: false,
  filesystem: false,
}

export function mapKnowledgeBaseToVirtualProject(
  connectionId: string,
  knowledgeBase: KnowledgeModel,
): PandaWikiVirtualProject {
  return {
    id: buildPandaWikiProjectId(connectionId, knowledgeBase.id),
    source: "pandawiki",
    name: knowledgeBase.name,
    connectionId,
    knowledgeBaseId: knowledgeBase.id,
    scopeKey: buildProviderScopeKey(connectionId, knowledgeBase.id),
    capabilities: { ...PANDAWIKI_PROJECT_CAPABILITIES },
  }
}
```

- [ ] **Step 4: Run focused tests**

Run: `npx vitest run src/domain/projects.test.ts src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the mapping**

```powershell
git add src/services/providers/pandawiki/PandaWikiVirtualProject.ts src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts src/services/providers/pandawiki/capabilities.ts
git commit -m "feat: map PandaWiki knowledge bases to virtual projects"
```

---

### Task 3: Add Authenticated Workspace and Scope State

**Files:**
- Create: `src/stores/pandawiki-workspace-store.ts`
- Create: `src/stores/pandawiki-workspace-store.test.ts`
- Modify: `src/stores/wiki-store.ts`

**Interfaces:**
- Consumes: `AuthSession`, `PandaWikiVirtualProject`, `ProviderScopeKey`.
- Produces: `usePandaWikiWorkspaceStore`, `beginScopeRequest(scopeKey)`, `isCurrentScope(scopeKey, generation)`, and `activatePandaWikiProject(project)`.

- [ ] **Step 1: Write failing scope-isolation tests**

```ts
import { beforeEach, describe, expect, it } from "vitest"
import { usePandaWikiWorkspaceStore } from "./pandawiki-workspace-store"

describe("PandaWiki workspace scope", () => {
  beforeEach(() => usePandaWikiWorkspaceStore.getState().reset())

  it("rejects a response from the previously selected knowledge base", () => {
    const store = usePandaWikiWorkspaceStore.getState()
    store.setActiveScope("server:kb-a")
    const request = usePandaWikiWorkspaceStore.getState().beginScopeRequest()
    usePandaWikiWorkspaceStore.getState().setActiveScope("server:kb-b")
    expect(usePandaWikiWorkspaceStore.getState().isCurrentRequest(request)).toBe(false)
  })

  it("aborts the previous scope controller during project switch", () => {
    usePandaWikiWorkspaceStore.getState().setActiveScope("server:kb-a")
    const signal = usePandaWikiWorkspaceStore.getState().beginScopeRequest().signal
    usePandaWikiWorkspaceStore.getState().setActiveScope("server:kb-b")
    expect(signal.aborted).toBe(true)
  })
})
```

- [ ] **Step 2: Run and verify failure**

Run: `npx vitest run src/stores/pandawiki-workspace-store.test.ts`

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Implement focused state with generation checks**

```ts
interface ScopeRequest {
  scopeKey: ProviderScopeKey
  generation: number
  signal: AbortSignal
}

interface PandaWikiWorkspaceState {
  session: AuthSession | null
  projects: PandaWikiVirtualProject[]
  activeScopeKey: ProviderScopeKey | null
  generation: number
  controller: AbortController | null
  setSession(session: AuthSession | null): void
  setProjects(projects: PandaWikiVirtualProject[]): void
  setActiveScope(scopeKey: ProviderScopeKey | null): void
  beginScopeRequest(): ScopeRequest
  isCurrentRequest(request: Pick<ScopeRequest, "scopeKey" | "generation">): boolean
  reset(): void
}
```

`setActiveScope` must abort the old controller, create a new controller, increment `generation`, and clear provider-scoped node/search/chat fields in `useWikiStore` through one named reset action. `isCurrentRequest` must compare both scope and generation.

- [ ] **Step 4: Run focused store tests**

Run: `npx vitest run src/stores/pandawiki-workspace-store.test.ts src/stores/wiki-store.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit scope isolation**

```powershell
git add src/stores/pandawiki-workspace-store.ts src/stores/pandawiki-workspace-store.test.ts src/stores/wiki-store.ts src/stores/wiki-store.test.ts
git commit -m "feat: isolate PandaWiki project request scope"
```

---

### Task 4: Add PandaWiki Knowledge Bases to the Existing Project Selector

**Files:**
- Create: `src/components/project/pandawiki-project-list.tsx`
- Create: `src/components/project/pandawiki-project-list.test.tsx`
- Modify: `src/components/project/welcome-screen.tsx`
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/zh.json`

**Interfaces:**
- Consumes: `PandaWikiVirtualProject[]`, `loading`, `error`, `onSelectProject(project)`.
- Produces: `PandaWikiProjectList` and a source-aware `WelcomeScreen` that never calls recent-local-project removal with a remote identity.

- [ ] **Step 1: Write failing selection tests**

Use the repository's existing React test utilities and assert:

```tsx
render(<PandaWikiProjectList projects={[remote]} loading={false} error={null} onSelectProject={select} />)
await user.click(screen.getByRole("button", { name: /Research/ }))
expect(select).toHaveBeenCalledWith(remote)
expect(screen.queryByLabelText(/remove/i)).not.toBeInTheDocument()
```

Also cover loading, empty knowledge-base, and safe error states.

- [ ] **Step 2: Run and verify failure**

Run: `npx vitest run src/components/project/pandawiki-project-list.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the remote project section**

`PandaWikiProjectList` renders a separate “PandaWiki knowledge bases” section and invokes `onSelectProject` with the exact virtual project. `WelcomeScreen` keeps existing New/Open/Recent Local Project behavior and receives additional props:

```ts
interface WelcomeScreenProps {
  onCreateProject(): void
  onOpenProject(): void
  onSelectProject(project: Project): void
  pandaWikiProjects: PandaWikiVirtualProject[]
  pandaWikiProjectsLoading: boolean
  pandaWikiProjectsError: string | null
}
```

Recent-project persistence remains local-only. Narrow with `isLocalProject` before using `path` or showing the remove button.

- [ ] **Step 4: Run component tests and typecheck**

Run: `npx vitest run src/components/project/pandawiki-project-list.test.tsx && npm run typecheck`

Expected: component tests PASS; remaining type errors are confined to App entry and local-only views addressed in Tasks 5-6.

- [ ] **Step 5: Commit the selector UI**

```powershell
git add src/components/project/pandawiki-project-list.tsx src/components/project/pandawiki-project-list.test.tsx src/components/project/welcome-screen.tsx src/i18n/en.json src/i18n/zh.json
git commit -m "feat: show PandaWiki knowledge bases as projects"
```

---

### Task 5: Restore AppLayout After PandaWiki Login

**Files:**
- Modify: `src/App.tsx:25-668`
- Create: `src/App.pandawiki-project.test.tsx`
- Modify: `src/components/layout/app-layout.tsx`
- Create: `src/components/layout/remote-project-home.tsx`
- Modify: `src/components/layout/content-area.tsx`

**Interfaces:**
- Consumes: PandaWiki authentication provider, `mapKnowledgeBaseToVirtualProject`, `usePandaWikiWorkspaceStore`, and `Project` narrowing helpers.
- Produces: one top-level flow: login -> project selector -> existing `AppLayout`.

- [ ] **Step 1: Write the failing top-level regression test**

Mock the PandaWiki provider with one knowledge base and assert:

```tsx
render(<App />)
await completePandaWikiLogin()
await user.click(await screen.findByRole("button", { name: /Research KB/ }))
expect(screen.getByTestId("app-layout")).toBeInTheDocument()
expect(screen.getByText(/Feature modules|功能模块/)).toBeReachableThroughSettings()
expect(screen.queryByTestId("panda-wiki-standalone-workspace")).not.toBeInTheDocument()
```

Use concrete accessible navigation interactions instead of implementing a custom `toBeReachableThroughSettings` matcher if none exists.

- [ ] **Step 2: Run and verify current behavior fails**

Run: `npx vitest run src/App.pandawiki-project.test.tsx`

Expected: FAIL because authenticated mode renders `PandaWikiWorkspace` immediately.

- [ ] **Step 3: Replace the top-level workspace branch**

In `App.tsx`:

1. Keep the login branch while no valid session exists.
2. After login/restore, call `provider.knowledge.listKnowledgeBases()`.
3. Map the response with the configured connection ID.
4. Render `WelcomeScreen` until a local or remote project is selected.
5. On remote selection, reset source-scoped state, set the union project in `useWikiStore`, set the active scope, and skip every local hydration routine (`loadChatHistory`, review/lint persistence, queue restore, watchers, scheduled import, and local LLM overrides).
6. Render `<AppLayout onSwitchProject={handleSwitchProject} />` for either project source.
7. Remove the authenticated `return <PandaWikiWorkspace ... />` branch. Do not delete the component file.

Add this mandatory narrowing at the start of the existing local hydration function:

```ts
async function hydrateLocalProject(project: Project): Promise<void> {
  if (!isLocalProject(project)) return
  // existing local hydration sequence, unchanged
}
```

- [ ] **Step 4: Prevent AppLayout from loading a local tree for remote projects**

```ts
const loadFileTree = useCallback(async () => {
  if (!project || !isLocalProject(project)) return
  await refreshProjectFileTree(project.path, {
    projectId: project.id,
    clearDisplayTreeFirst: true,
  })
}, [project])
```

`ContentArea` must always allow `settings` and `plugin`. For a remote project and a local-only active view during this phase, render `RemoteProjectHome` with an explicit unavailable-capability message instead of mounting a filesystem feature.

- [ ] **Step 5: Run the top-level and existing layout tests**

Run: `npx vitest run src/App.pandawiki-project.test.tsx src/components/layout/app-layout-visibility.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit restored shell behavior**

```powershell
git add src/App.tsx src/App.pandawiki-project.test.tsx src/components/layout/app-layout.tsx src/components/layout/remote-project-home.tsx src/components/layout/content-area.tsx
git commit -m "fix: keep the LLM Wiki shell for PandaWiki projects"
```

---

### Task 6: Enforce Capability and Filesystem Isolation

**Files:**
- Create: `src/lib/project-capabilities.ts`
- Create: `src/lib/project-capabilities.test.ts`
- Modify: `src/components/layout/icon-sidebar.tsx`
- Modify: `src/components/layout/sidebar-panel.tsx`
- Modify: local-only components reported by `npm run typecheck`
- Modify: `src/core/plugins/host/types.ts`
- Modify: `src/core/plugins/host/PluginHost.ts`
- Modify: `src/core/plugins/host/PluginHost.test.ts`

**Interfaces:**
- Consumes: `ProjectCapabilities`, `Project`, `isLocalProject`.
- Produces: `isViewAvailable(project, view)`, `assertFilesystemProject(project, operation)`, and a project API that does not require `path` for remote projects.

- [ ] **Step 1: Write failing capability tests**

```ts
expect(isViewAvailable(remote, "settings")).toBe(true)
expect(isViewAvailable(remote, "plugin")).toBe(true)
expect(isViewAvailable(remote, "graph")).toBe(false)
expect(isViewAvailable(remote, "sources")).toBe(false)
expect(() => assertFilesystemProject(remote, "read file")).toThrow(UnsupportedProjectOperationError)
```

Add a `PluginHost` regression test whose remote project is active and whose `files.exists/readText/writeText/createDirectory` mocks all throw if called. Calling remote plugin storage must return a typed unsupported-storage result/error without invoking any mock.

- [ ] **Step 2: Run and verify failure**

Run: `npx vitest run src/lib/project-capabilities.test.ts src/core/plugins/host/PluginHost.test.ts`

Expected: FAIL because view policy and remote storage guards do not exist.

- [ ] **Step 3: Implement the view/action matrix**

The matrix must keep `settings` and `plugin` available for all projects. For PandaWiki Phase 1 it disables local filesystem views/actions including sources, graph, review, lint, local editor mutation, file-history, new idea, quick capture, folder reveal, watchers, ingest, and local maintenance tools. Chat/search icons remain visible only if their Provider adapter is actually registered; do not infer availability from a label.

- [ ] **Step 4: Narrow every filesystem call site reported by TypeScript**

Use one of these two forms only:

```ts
if (!project || !isLocalProject(project)) return <UnsupportedProjectFeature feature="graph" />
```

or:

```ts
const localProject = requireLocalProject(project, "open project folder")
await openProjectFolder(localProject.path)
```

Do not use casts, non-null assertions, `path?: string`, `"path" in project` scattered through UI code, or synthetic remote paths. Background effects must return before scheduling a watcher or local persistence call.

- [ ] **Step 5: Make plugin project identity source-aware**

Change the plugin-facing project shape to:

```ts
export type PluginProject =
  | { id: string; source: "local"; name: string; path: string }
  | { id: string; source: "pandawiki"; name: string; connectionId: string; knowledgeBaseId: string }
```

Subscription compares `project?.id` and `project?.source`, not `project?.path`. In this phase, local plugin storage remains filesystem-backed. Remote plugin storage returns `UnsupportedProjectOperationError("plugin storage", "pandawiki")` before any file command. The later plugin-storage phase will replace that branch with app-data storage; do not fake a project path now.

- [ ] **Step 6: Run the full mock suite and typecheck**

Run: `npm run typecheck && npm run test:mocks`

Expected: typecheck PASS; all mock tests PASS with no network dependency.

- [ ] **Step 7: Commit isolation changes**

```powershell
git add src/lib/project-capabilities.ts src/lib/project-capabilities.test.ts src/components src/core/plugins/host src/stores src/lib
git diff --cached --name-only
git commit -m "fix: isolate remote projects from local filesystem features"
```

Review the staged file list before committing; remove unrelated formatting or generated artifacts.

---

### Task 7: Phase 1 Verification and Desktop Smoke Build

**Files:**
- Modify only test fixtures that still construct legacy path-only projects.
- Do not change production behavior during this task unless a failing test demonstrates a Phase 1 regression.

**Interfaces:**
- Consumes all prior tasks.
- Produces a verified Phase 1 branch ready for Phase 2 remote knowledge-tree integration.

- [ ] **Step 1: Replace legacy local-project fixtures explicitly**

Every local fixture must include:

```ts
{
  id: "project-1",
  source: "local",
  name: "Project",
  path: "/project",
  capabilities: LOCAL_PROJECT_CAPABILITIES,
}
```

Do not weaken the production union to accommodate old test objects.

- [ ] **Step 2: Run focused virtual-project regression tests**

Run:

```powershell
npx vitest run `
  src/domain/projects.test.ts `
  src/services/providers/pandawiki/PandaWikiVirtualProject.test.ts `
  src/stores/pandawiki-workspace-store.test.ts `
  src/components/project/pandawiki-project-list.test.tsx `
  src/App.pandawiki-project.test.tsx `
  src/lib/project-capabilities.test.ts `
  src/core/plugins/host/PluginHost.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run complete frontend verification**

Run:

```powershell
npm run typecheck
npm run test:mocks
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Run Tauri verification**

Run:

```powershell
Push-Location src-tauri
cargo check
cargo test
Pop-Location
```

Expected: all commands exit 0. No credential or TLS configuration changes are expected in this phase.

- [ ] **Step 5: Manual LAN acceptance**

Using the existing trusted PandaWiki endpoint:

1. launch `npm run tauri dev`;
2. log in to PandaWiki;
3. select a returned knowledge base from the normal project chooser;
4. confirm the original icon sidebar and `AppLayout` are visible;
5. open Settings and confirm Feature modules is visible;
6. enable Submission management and confirm its navigation entry appears;
7. confirm unsupported local actions are absent or disabled;
8. switch between two KBs and confirm no stale title/tree/chat state from the first KB appears;
9. switch to a local project and confirm its previous filesystem behavior still works.

Expected: all nine checks pass. Phase 2 will add remote node-tree/detail content to the restored shell.

- [ ] **Step 6: Commit verification fixture updates**

```powershell
git add src
git diff --cached --name-only
git commit -m "test: cover PandaWiki virtual project shell integration"
```

If no fixture changes were required, do not create an empty commit.

---

## Plan Self-Review

- Spec coverage: stable identity, discriminated union, capability gating, original `AppLayout`, provider scope isolation, plugin visibility, local regression protection, and no fake path are each assigned to a task.
- Scope control: remote node reading, authenticated search behavior, conversation routing, and durable remote plugin storage are intentionally left for subsequent phases; Phase 1 only restores the shell and establishes safe boundaries.
- Type consistency: all tasks use `Project`, `LocalProject`, `PandaWikiVirtualProject`, and `ProviderScopeKey` from `src/domain/projects.ts`; the exact stable ID and scope formats are consistent.
- Placeholder scan: no unresolved markers, implicit duplicate-test references, or unspecified implementation steps remain.
