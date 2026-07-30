# Industry Workspace Suites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one preinstalled Workspaces plugin exposing Research, Legal, and Investment Research suite views without changing PandaWiki data or duplicating local analysis.

**Architecture:** Register one official built-in plugin with one global navigation item. Its page owns suite and inner-menu selection, while reusable pure helpers derive filtered views from mapped `KnowledgeGraphModel` data returned by the existing permission-filtered `GraphProvider`. Existing active views handle remote documents, search, graph, and chat.

**Tech Stack:** React, TypeScript, Vitest, Zustand, Lucide, existing LLM Wiki PluginHost and PandaWiki provider adapters.

## Global Constraints

- All three suites are preinstalled and visible; no entitlement or edition gate is introduced.
- Keep one global Workspaces icon; suite functions are inner-menu items.
- Do not add a PandaWiki endpoint, migration, filesystem access, local embedding, or local graph fallback.
- PandaWiki graph/schema response remains authoritative and permission-filtered by the server.
- Reuse the existing submission-management plugin rather than copying its domain or storage.
- Keep local and PandaWiki projects isolated by `project.source` and existing capabilities.

---

### Task 1: Define testable suite descriptors and graph projections

**Files:**
- Create: `src/plugins/industry-workspaces/domain/workspace-suites.ts`
- Create: `src/plugins/industry-workspaces/domain/workspace-suites.test.ts`
- Create: `src/plugins/industry-workspaces/domain/graph-projections.ts`
- Create: `src/plugins/industry-workspaces/domain/graph-projections.test.ts`

**Interfaces:**
- Produces `WorkspaceSuite`, `WorkspaceMenuItem`, `WORKSPACE_SUITES`, `getVisibleSuiteMenuItems`.
- Produces `filterEntitiesByTypes`, `buildAttributeTimeline`, `buildAttributeBoard` over `KnowledgeGraphModel`/`EntityModel`.

- [ ] **Step 1: Write failing descriptor tests**

```ts
expect(WORKSPACE_SUITES.map((suite) => suite.id)).toEqual([
  "research", "legal", "investment",
])
expect(getVisibleSuiteMenuItems(research, remoteProject)).toContainEqual(
  expect.objectContaining({ id: "graph", targetView: "graph" }),
)
```

- [ ] **Step 2: Run descriptor test and verify it fails because the module does not exist**

Run: `npx vitest run src/plugins/industry-workspaces/domain/workspace-suites.test.ts`

- [ ] **Step 3: Implement descriptors with capability requirements**

```ts
export interface WorkspaceMenuItem {
  id: string
  label: string
  targetView?: "wiki" | "search" | "graph" | "chat"
  route?: "plugin:official.submission-management"
  requires?: keyof ProjectCapabilities
}
```

Each suite must have Overview plus only its documented inner-menu entries. `getVisibleSuiteMenuItems` hides actions whose `requires` capability is false.

- [ ] **Step 4: Write failing graph-projection tests**

```ts
expect(filterEntitiesByTypes(graph, ["person"])).toEqual([personEntity])
expect(buildAttributeTimeline(graph, "event_date").map((row) => row.entity.id)).toEqual([older.id, newer.id])
expect(buildAttributeBoard(graph, "risk_level").get("high")).toEqual([highRiskEntity])
```

- [ ] **Step 5: Implement pure projections and validate them**

Only accept values already present in `EntityModel.attributes`; omit blank/non-string/non-finite values. The timeline sorts ISO-like date strings ascending and the board uses a stable alphabetical bucket order.

- [ ] **Step 6: Run unit tests**

Run: `npx vitest run src/plugins/industry-workspaces/domain`
Expected: all descriptor and projection tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/plugins/industry-workspaces/domain
git commit -m "feat: define industry workspace suites"
```

### Task 2: Register one built-in Workspaces plugin

**Files:**
- Create: `src/plugins/industry-workspaces/manifest.ts`
- Create: `src/plugins/industry-workspaces/index.ts`
- Create: `src/plugins/industry-workspaces/IndustryWorkspacesPage.tsx`
- Create: `src/plugins/industry-workspaces/industry-workspaces.test.tsx`
- Modify: `src/core/plugins/builtinPlugins.ts`

**Interfaces:**
- Consumes `WORKSPACE_SUITES` and active `PluginHost` project API.
- Produces `createIndustryWorkspacesPlugin(host): LlmWikiPlugin` with route `plugin:official.industry-workspaces` and `defaultEnabled: true`.

- [ ] **Step 1: Write failing registration/page tests**

```tsx
expect(createIndustryWorkspacesPlugin(host).manifest.defaultEnabled).toBe(true)
expect(createIndustryWorkspacesPlugin(host).navigationItems?.[0]).toMatchObject({
  route: "plugin:official.industry-workspaces",
})
render(<IndustryWorkspacesPage host={host} />)
expect(screen.getByRole("button", { name: "Research Workspace" })).toBeVisible()
```

- [ ] **Step 2: Run the test and verify the plugin module is missing**

Run: `npx vitest run src/plugins/industry-workspaces/industry-workspaces.test.tsx`

- [ ] **Step 3: Implement manifest, plugin factory, and suite shell**

Use `BriefcaseBusiness` as the single global icon. The page renders a suite selector plus an inner menu, retains selection in component state, and calls `useWikiStore.getState().setActiveView(item.targetView)` or `setActivePluginRoute(item.route)` for cross-surface navigation. It must never set a local path or invoke any host documents API.

- [ ] **Step 4: Register the plugin and run tests**

Update `builtinPlugins` to include `createIndustryWorkspacesPlugin` before submission management. Run: `npx vitest run src/plugins/industry-workspaces/industry-workspaces.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/core/plugins/builtinPlugins.ts src/plugins/industry-workspaces
git commit -m "feat: add industry workspace shell"
```

### Task 3: Render server-backed legal and investment projections

**Files:**
- Create: `src/plugins/industry-workspaces/components/remote-graph-snapshot.tsx`
- Create: `src/plugins/industry-workspaces/components/remote-graph-snapshot.test.tsx`
- Modify: `src/plugins/industry-workspaces/IndustryWorkspacesPage.tsx`
- Modify: `src/components/layout/content-area.tsx`
- Modify: `src/components/layout/app-layout.tsx` only if a graph provider must be passed to the plugin page through existing context; otherwise do not modify it.

**Interfaces:**
- Consumes existing `GraphProvider.getGraph(knowledgeBaseId)` and mapped graph domain models.
- Produces read-only entity list, date timeline, and attribute board. No mutation endpoint is called.

- [ ] **Step 1: Write failing component tests**

```tsx
render(<RemoteGraphSnapshot graphProvider={provider} project={remoteProject} mode="timeline" />)
await expect(screen.findByText("Evidence timeline")).resolves.toBeVisible()
expect(screen.getByText("No dated facts are available yet.")).toBeVisible()
```

- [ ] **Step 2: Run the test and verify it fails because the component is absent**

Run: `npx vitest run src/plugins/industry-workspaces/components/remote-graph-snapshot.test.tsx`

- [ ] **Step 3: Implement provider-safe snapshot component**

Fetch only when `project.source === "pandawiki"` and a graph provider exists. Present loading/error/empty states. Legal uses `event`/`document` types and a configured `event_date`/`date` field; Investment uses `organization`/`person` types and `risk_level`/`risk` field. If fields are absent, state that an administrator must configure the server knowledge schema and rebuild the graph.

- [ ] **Step 4: Inject the existing graph provider without adding a new global data store**

Extend the existing plugin page rendering path only enough to pass the already-created `pandaWikiGraphProvider` as a prop/context to IndustryWorkspacesPage. Preserve the generic PluginPage contract and existing SubmissionManagementPage behavior.

- [ ] **Step 5: Run targeted tests**

Run: `npx vitest run src/plugins/industry-workspaces/components src/plugins/industry-workspaces/industry-workspaces.test.tsx`
Expected: provider calls use only the active `knowledgeBaseId`; unavailable/local states show no fabricated remote data.

- [ ] **Step 6: Commit**

```bash
git add src/plugins/industry-workspaces src/components/layout/content-area.tsx src/components/layout/app-layout.tsx
git commit -m "feat: add server-backed legal and investment views"
```

### Task 4: Verify the full demo surface

**Files:**
- Modify: `README.md` only if its plugin inventory is a maintained user-facing list.

- [ ] **Step 1: Add or update a focused regression test for one global Workspaces icon and three visible suites**

```tsx
expect(screen.getAllByLabelText(/Workspaces/i)).toHaveLength(1)
expect(screen.getByText("Legal Workspace")).toBeVisible()
expect(screen.getByText("Investment Research Workspace")).toBeVisible()
```

- [ ] **Step 2: Run focused plugin tests**

Run: `npx vitest run src/plugins/industry-workspaces`

- [ ] **Step 3: Run project verification**

Run: `npm run typecheck && npm run test:mocks`
Expected: TypeScript succeeds and the full mock suite remains green.

- [ ] **Step 4: Build the desktop application when the local Rust toolchain is available**

Run: `npm run tauri build`
Expected: build succeeds or reports only an environment-specific packaging issue; report the exact limitation without changing TLS or credential code.

- [ ] **Step 5: Commit and push only the feature changes**

```bash
git add README.md src/plugins/industry-workspaces
git commit -m "docs: describe industry workspace demo"
git push origin feature/submission-management
```
