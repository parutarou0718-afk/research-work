import type { AuthSession, FileTreeModel, KnowledgeModel, LoginInput, NodeModel } from "@/types/wiki"
import type { AuthProvider } from "../contracts/AuthProvider"
import type { ProviderBundle } from "../contracts/ProviderBundle"
import type { SearchProvider } from "../contracts/SearchProvider"
import type { NodeEditorProvider, NodeUpdateInput } from "../contracts/NodeEditorProvider"
import type { UserDTO } from "./dto/AuthDTO"
import { PandaWikiAuthApi } from "./api/auth-api"
import { PandaWikiKnowledgeApi } from "./api/knowledge-api"
import { PandaWikiKnowledgeSearchApi } from "./api/knowledge-search-api"
import { PandaWikiNodeApi } from "./api/node-api"
import { PandaWikiApiError, PandaWikiClient } from "./api/client"
import type { KnowledgeDTO } from "./dto/KnowledgeDTO"
import type { KnowledgeSearchResponseDTO } from "./dto/KnowledgeSearchDTO"
import type { NodeDTO, NodeTreeDTO } from "./dto/NodeDTO"
import { mapKnowledgeDto } from "./mapper/KnowledgeMapper"
import { mapKnowledgeSearchDto } from "./mapper/KnowledgeSearchMapper"
import { mapNodeDto, mapNodeTreeDto } from "./mapper/NodeMapper"
import type { SessionStore } from "./session/SessionStore"
import { createDefaultSessionStore } from "./session/TauriSessionStore"
import { pandaWikiCapabilities } from "./capabilities"

export type PandaWikiProviderSkeleton = Pick<
  ProviderBundle,
  "id" | "type" | "lifecycle" | "capabilities"
>

export interface PandaWikiAuthGateway {
  setAccessToken(token: string | null): void
  login(account: string, password: string): Promise<{ token: string }>
  getCurrentUser(): Promise<UserDTO>
  refreshToken(): Promise<string>
  listKnowledgeBases(): Promise<KnowledgeDTO[]>
  getNodeTree(kbId: string): Promise<NodeTreeDTO>
  getNodeDetail(kbId: string, nodeId: string): Promise<NodeDTO>
  searchKnowledgeBase(kbId: string, query: string): Promise<KnowledgeSearchResponseDTO>
  updateNode(input: NodeUpdateInput): Promise<void>
}

export interface PandaWikiAuthenticationProvider extends ProviderBundle {
  auth: AuthProvider
  search: SearchProvider
  nodeEditor: NodeEditorProvider
  /**
   * Workspace selection is kept beside the adapter, never inferred from a
   * virtual project's display name or a local filesystem path.
   */
  selectKnowledgeBase(knowledgeBaseId: string): void
}

export interface PandaWikiProviderOptions {
  baseUrl: string
  sessionStore?: SessionStore
  createGateway?: (baseUrl: string) => Promise<PandaWikiAuthGateway>
}

function mapSession(accessToken: string, user: UserDTO): AuthSession {
  return {
    accessToken,
    user: { id: user.id, account: user.account, role: user.role },
  }
}

async function createDefaultGateway(baseUrl: string): Promise<PandaWikiAuthGateway> {
  const client = await PandaWikiClient.create(baseUrl)
  const auth = new PandaWikiAuthApi(client)
  const knowledge = new PandaWikiKnowledgeApi(client)
  const search = new PandaWikiKnowledgeSearchApi(client)
  const nodes = new PandaWikiNodeApi(client)
  return {
    setAccessToken: (token) => client.setAccessToken(token),
    login: (account, password) => auth.login(account, password),
    getCurrentUser: () => auth.getCurrentUser(),
    refreshToken: () => auth.refreshToken(),
    listKnowledgeBases: () => knowledge.listKnowledgeBases(),
    getNodeTree: (kbId) => nodes.getNodeTree(kbId),
    getNodeDetail: (kbId, nodeId) => nodes.getNodeDetail(kbId, nodeId),
    searchKnowledgeBase: (kbId, query) => search.search(kbId, query),
    updateNode: (input) => nodes.updateNode(input),
  }
}

/**
 * Phase 1B intentionally exposes authentication, not a fabricated complete
 * ProviderBundle. KnowledgeProvider is connected in Phase 1C.
 */
export function createPandaWikiProvider(options: PandaWikiProviderOptions): PandaWikiAuthenticationProvider {
  const sessionStore = options.sessionStore ?? createDefaultSessionStore()
  const createGateway = options.createGateway ?? createDefaultGateway
  let baseUrl = options.baseUrl
  let gateway: PandaWikiAuthGateway | null = null
  let activeSession: AuthSession | null = null
  let activeKnowledgeBaseId: string | null = null
  const nodeKnowledgeBaseIds = new Map<string, string>()

  const ensureGateway = async (serverUrl = baseUrl): Promise<PandaWikiAuthGateway> => {
    if (!gateway || serverUrl !== baseUrl) {
      baseUrl = serverUrl
      gateway = await createGateway(baseUrl)
    }
    return gateway
  }

  const clearSession = async (): Promise<void> => {
    activeSession = null
    gateway?.setAccessToken(null)
    await sessionStore.clear()
  }

  const auth: AuthProvider = {
    login: async (credentials: LoginInput) => {
      const nextGateway = await ensureGateway(credentials.serverUrl)
      const { token } = await nextGateway.login(credentials.account, credentials.password)
      nextGateway.setAccessToken(token)
      try {
        const user = await nextGateway.getCurrentUser()
        activeSession = mapSession(token, user)
        await sessionStore.saveAccessToken(token)
        return activeSession
      } catch (error) {
        nextGateway.setAccessToken(null)
        throw error
      }
    },
    logout: async () => {
      await clearSession()
    },
    refreshToken: async () => (await ensureGateway()).refreshToken(),
    getSession: () => activeSession,
  }

  const getActiveKnowledgeBaseId = async (): Promise<string> => {
    if (activeKnowledgeBaseId) return activeKnowledgeBaseId
    const knowledgeBases = await ensureGateway().then((nextGateway) => nextGateway.listKnowledgeBases())
    const firstKnowledgeBase = knowledgeBases[0]
    if (!firstKnowledgeBase) throw new PandaWikiApiError("not-found", 404)
    activeKnowledgeBaseId = firstKnowledgeBase.id
    return activeKnowledgeBaseId
  }

  const knowledge = {
    listKnowledgeBases: async (): Promise<KnowledgeModel[]> => {
      const knowledgeBases = await (await ensureGateway()).listKnowledgeBases()
      const mapped = knowledgeBases.map(mapKnowledgeDto)
      if (!activeKnowledgeBaseId || !mapped.some((knowledgeBase) => knowledgeBase.id === activeKnowledgeBaseId)) {
        activeKnowledgeBaseId = mapped[0]?.id ?? null
      }
      return mapped
    },
    getNodeTree: async (): Promise<FileTreeModel> => {
      const kbId = await getActiveKnowledgeBaseId()
      const tree = await (await ensureGateway()).getNodeTree(kbId)
      for (const group of tree.groups) {
        for (const node of group.list) nodeKnowledgeBaseIds.set(node.id, kbId)
      }
      return mapNodeTreeDto(tree)
    },
    getNode: async (id: string): Promise<NodeModel> => {
      const kbId = nodeKnowledgeBaseIds.get(id) ?? await getActiveKnowledgeBaseId()
      return mapNodeDto(await (await ensureGateway()).getNodeDetail(kbId, id))
    },
  }

  const search: SearchProvider = {
    search: async (knowledgeBaseId, query) => {
      const results = await (await ensureGateway()).searchKnowledgeBase(knowledgeBaseId, query)
      return mapKnowledgeSearchDto(results)
    },
  }

  const nodeEditor: NodeEditorProvider = {
    updateNode: async (input) => {
      await (await ensureGateway()).updateNode(input)
    },
  }

  return {
    id: "pandawiki",
    type: "pandawiki",
    capabilities: pandaWikiCapabilities,
    auth,
    selectKnowledgeBase: (knowledgeBaseId) => {
      activeKnowledgeBaseId = knowledgeBaseId
      nodeKnowledgeBaseIds.clear()
    },
    knowledge,
    search,
    nodeEditor,
    lifecycle: {
      initialize: async () => {
        const nextGateway = await ensureGateway()
        const token = await sessionStore.loadAccessToken()
        if (!token) {
          try {
            await nextGateway.getCurrentUser()
          } catch (error) {
            if (error instanceof PandaWikiApiError && error.kind === "unauthorized") return
            throw error
          }
          return
        }

        nextGateway.setAccessToken(token)
        try {
          activeSession = mapSession(token, await nextGateway.getCurrentUser())
        } catch (error) {
          if (error instanceof PandaWikiApiError && error.kind === "unauthorized") {
            await clearSession()
            return
          }
          throw error
        }
      },
      dispose: clearSession,
    },
  }
}

export function createPandaWikiProviderSkeleton(): PandaWikiProviderSkeleton {
  const provider = createPandaWikiProvider({ baseUrl: "" })
  return {
    id: provider.id,
    type: provider.type,
    capabilities: provider.capabilities,
    lifecycle: provider.lifecycle,
  }
}
