import { create } from "zustand"
import type { AuthSession } from "@/types/wiki"
import type { PandaWikiVirtualProject, ProviderScopeKey } from "@/domain/projects"

export interface ScopeRequest {
  scopeKey: ProviderScopeKey
  generation: number
  signal: AbortSignal
}

interface PandaWikiWorkspaceState {
  session: AuthSession | null
  projects: PandaWikiVirtualProject[]
  activeScopeKey: ProviderScopeKey | null
  selectedGraphEntityId: string | null
  generation: number
  controller: AbortController | null
  setSession(session: AuthSession | null): void
  setProjects(projects: PandaWikiVirtualProject[]): void
  setActiveScope(scopeKey: ProviderScopeKey | null): void
  setSelectedGraphEntity(entityId: string | null): void
  beginScopeRequest(): ScopeRequest
  isCurrentRequest(request: Pick<ScopeRequest, "scopeKey" | "generation">): boolean
  reset(): void
}

function abort(controller: AbortController | null): void {
  controller?.abort()
}

export const usePandaWikiWorkspaceStore = create<PandaWikiWorkspaceState>((set, get) => ({
  session: null,
  projects: [],
  activeScopeKey: null,
  selectedGraphEntityId: null,
  generation: 0,
  controller: null,
  setSession: (session) => set({ session }),
  setProjects: (projects) => set({ projects }),
  setActiveScope: (activeScopeKey) => {
    abort(get().controller)
    set((state) => ({
      activeScopeKey,
      selectedGraphEntityId: null,
      generation: state.generation + 1,
      controller: activeScopeKey ? new AbortController() : null,
    }))
  },
  setSelectedGraphEntity: (selectedGraphEntityId) => set({ selectedGraphEntityId }),
  beginScopeRequest: () => {
    const state = get()
    if (!state.activeScopeKey || !state.controller) {
      throw new Error("A PandaWiki project scope must be active before starting a request.")
    }
    return {
      scopeKey: state.activeScopeKey,
      generation: state.generation,
      signal: state.controller.signal,
    }
  },
  isCurrentRequest: (request) => {
    const state = get()
    return state.activeScopeKey === request.scopeKey && state.generation === request.generation
  },
  reset: () => {
    abort(get().controller)
    set((state) => ({
      session: null,
      projects: [],
      activeScopeKey: null,
      selectedGraphEntityId: null,
      generation: state.generation + 1,
      controller: null,
    }))
  },
}))
