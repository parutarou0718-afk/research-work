# PandaWiki × research-work：Phase 1 集成计划（Phase 0 输出）

## 架构决策

采用组合能力 Provider，而非单体接口：

```text
UI → Provider-aware Store → ProviderBundle → API adapter → DTO → Mapper → Domain Model
```

`pandawiki/dto/*` 只能由 PandaWiki adapter 和 mapper 导入；`src/stores/*`、组件和 `src/types/wiki.ts` 只能看到 Domain Model。PandaWiki 请求失败返回明确错误，不切换到 LocalProvider。Phase 1 不引入 Event Bus，使用 Zustand action 与直接函数调用。

## Phase 1A：精确文件清单（Provider 骨架）

### 新建

```text
src/services/providers/contracts/AuthProvider.ts
src/services/providers/contracts/KnowledgeProvider.ts
src/services/providers/contracts/ConversationProvider.ts
src/services/providers/contracts/DocumentProvider.ts
src/services/providers/contracts/GraphProvider.ts
src/services/providers/contracts/TemplateProvider.ts
src/services/providers/contracts/SearchProvider.ts
src/services/providers/contracts/ProviderLifecycle.ts
src/services/providers/contracts/ProviderCapabilities.ts
src/services/providers/contracts/ProviderBundle.ts
src/services/providers/ProviderManager.ts
src/services/providers/mock/MockProvider.ts
src/services/providers/pandawiki/dto/AuthDTO.ts
src/services/providers/pandawiki/dto/KnowledgeDTO.ts
src/services/providers/pandawiki/dto/NodeDTO.ts
src/services/providers/pandawiki/dto/ConversationDTO.ts
src/services/providers/pandawiki/dto/DocumentDTO.ts
src/services/providers/pandawiki/dto/GraphDTO.ts
src/services/providers/pandawiki/dto/TemplateDTO.ts
src/services/providers/pandawiki/mapper/KnowledgeMapper.ts
src/services/providers/pandawiki/mapper/NodeMapper.ts
src/services/providers/pandawiki/mapper/ConversationMapper.ts
src/services/providers/pandawiki/mapper/DocumentMapper.ts
src/services/providers/pandawiki/mapper/GraphMapper.ts
src/services/providers/pandawiki/PandaWikiProvider.ts
src/services/providers/pandawiki/capabilities.ts
src/services/providers/local/LocalProvider.ts
src/services/providers/local/capabilities.ts
```

### 修改

```text
src/types/wiki.ts                         # 增加明确 Domain Model，不删除旧 Local 类型
```

### Phase 1A 不应修改

`src/App.tsx`、`src/stores/wiki-store.ts`、现有组件、PandaWiki 源码。Provider skeleton 只定义边界；PandaWiki/Local bundle 若尚不能提供 `knowledge`，不得伪造可工作的空实现。MockProvider 是唯一可完整运行的开发 Provider。

## Phase 1B：精确文件清单（认证）

### 新建

```text
src/services/providers/pandawiki/api/client.ts
src/services/providers/pandawiki/api/auth-api.ts
src/services/providers/pandawiki/session/SessionStore.ts
src/services/providers/pandawiki/session/TauriSessionStore.ts
src/components/auth/ProviderLogin.tsx
src/components/settings/ProviderSettings.tsx
src/config/providers.json
```

如果当前工程已有统一设置页面入口，可将 `ProviderSettings.tsx` 接入该入口；否则只创建组件、不重排现有设置结构。Web 的 token 方案不得新增 localStorage JWT：后端没有安全 Cookie 时，Web 不实现持久登录，桌面版使用 Tauri 的安全存储策略。

### 修改

```text
src/services/providers/pandawiki/PandaWikiProvider.ts # 实现 auth
src/services/providers/ProviderManager.ts              # 注册/选择 Provider、生命周期
src/App.tsx                                             # 初始化、认证 gate、工作台切换
src/components/settings/settings-view.tsx              # 挂入 ProviderSettings（按现有结构）
src/types/wiki.ts                                      # LoginInput/AuthSession/ProviderConfig
```

### 认证协议更正

PandaWiki adapter 的登录调用应为：

```text
POST /api/v1/user/login
{ "account": "…", "password": "…" }
→ envelope.data.token
```

随后使用 `GET /api/v1/user` 校验会话。`refreshToken()` 只能在后端提供真实 refresh/cookie 方案后实现；Phase 1B 不得冒充刷新或保存密码。

## Phase 1C：精确文件清单（知识树只读加载）

### 新建

```text
src/services/providers/pandawiki/api/knowledge-api.ts
src/services/providers/pandawiki/api/node-api.ts
```

### 修改

```text
src/services/providers/pandawiki/PandaWikiProvider.ts # 实现 KnowledgeProvider
src/stores/wiki-store.ts                              # provider-aware loadKnowledgeBases/loadNodeTree/loadNode
src/components/layout/knowledge-tree.tsx              # 消费 FileTreeModel/NodeModel，不读本地目录
src/components/layout/preview-panel.tsx               # PandaWiki 模式读取已加载 Node 内容
src/components/editor/wiki-reader.tsx                 # 只读渲染远端 Node Markdown
src/types/wiki.ts                                     # 完成 Knowledge/Node/FileTree 模型
```

`file-tree.tsx`、编辑器写入、source、search、chat、graph 不属于 Phase 1C；如当前布局必需显示这些入口，必须基于 capability 禁用/隐藏，而不是运行时调用 `commands/fs.ts`。

## 数据结构转换表

| PandaWiki API DTO（来源） | Domain Model | 转换规则与差异 |
|---|---|---|
| `LoginResp.data.token` | `AuthSession.accessToken` | token 只保留在 session adapter；Store/UI 只取 `isAuthenticated`、安全用户摘要。 |
| `GET /api/v1/user` 的 `id/account/role` | `AuthSession.user: {id, account, role}` | 时间转换为 ISO string 或 Date，选一种并统一。 |
| KB list `id,name,dataset_id,created_at,updated_at` | `KnowledgeModel { id, name, datasetId, createdAt, updatedAt }` | 不把 `access_settings` 的 private key、密码等传给 UI；Mapper 只选择展示安全字段。 |
| Node group/nav `{nav_id,nav_name,position,list[]}` | `FileTreeModel` | PandaWiki 返回“Nav 分组 + 扁平节点”，research-work 需要递归树；Mapper 以 `parent_id` 构树，保留 orphan 节点并显式标记，不能丢资料。 |
| Node list item `id,name,type,parent_id,nav_id,emoji,position,status,summary` | `FileTreeModel.nodes[]` | `FileNode.path` 不可复用；使用 `id`、`parentId`、`knowledgeBaseId`。 |
| Node detail `id,kb_id,name,content,meta,type,status,parent_id,created_at,updated_at` | `NodeModel` | `content` 是远端节点正文；`meta` 需定义受控 `Record<string, unknown>` 或明确结构，但不能保存 DTO 原件。 |
| Chat stream（待验证） | `ConversationChunk` | 在 Phase 4 才实现；必须先确定 SSE framing、错误事件、citation metadata 与 abort 行为。 |

建议新增的核心 Domain Model 仅包括：

```ts
type ProviderType = 'pandawiki' | 'local' | 'mock'
interface KnowledgeModel { id: string; name: string; datasetId: string; createdAt: string; updatedAt: string }
interface NodeModel { id: string; knowledgeBaseId: string; name: string; content: string; parentId: string | null; navId?: string; type: string; status: string; updatedAt: string }
interface FileTreeModel { knowledgeBaseId: string; roots: FileTreeNode[] }
interface FileTreeNode { id: string; name: string; parentId: string | null; children: FileTreeNode[]; nodeType: string; status: string }
```

其余 Phase 1A 模型可定义为契约，但不应提前接入 UI。

## AI 功能冲突与互斥规则

| 场景 | Local Provider | PandaWiki Provider |
|---|---|---|
| Chat | research-work `llm-client.ts` / 本地或用户配置模型 | 未来只经 PandaWiki ConversationProvider；不能同时向本地模型和后端发送资料。 |
| Embedding/ingest | `embedding.ts`、`ingest*.ts` 可用 | 禁用；PandaWiki 服务端负责解析、向量化、权限。 |
| 搜索 | 本地索引/AnyTXT | 后续只走服务端授权检索；失败必须报错。 |
| 文件写入 | Tauri FS | 后续 DocumentProvider/Node API；Phase 1 只读。 |
| 图谱 | `wiki-graph.ts` | 不支持，capability 为 false。 |

Provider 互斥并非删除 LocalProvider，而是防止同一个用户动作跨两个真源执行。切换时必须：取消请求/SSE → 清空 provider-scoped KB/Node/Chat state → dispose 旧 Provider → initialize 新 Provider → 重新加载；不保留跨 Provider 的未完成写入。

## 最小范围与明确排除项

Phase 1 的成功标准只是：一个已认证用户可以显式选择 PandaWiki Provider、列出他有权访问的 KB、选择 KB、看到 Nav/Node 树、打开 Node 详情，并在失败时得到明确错误。

以下全部排除：PandaWiki Go 修改、用户/角色管理、SSO、refresh token 后端、节点写入、上传/解析、聊天/SSE、搜索、图谱、行业模板/报告、投稿同步、迁移本地数据、自动 fallback、本地模型托管、Event Bus、整个 Store 的一次性重写。

## 实施前验收点

1. 用测试环境完成真实 curl/浏览器或 Tauri 登录验证；
2. 确认 `/api/v1` 的 CORS/反向代理与 HTTPS 策略；
3. 固定 envelope、错误码、401/403/404 和 token 失效语义；
4. 对 `node/list/group/nav` 的多 Nav、父子跨组、排序与 orphan 数据写 mapper 单元测试；
5. 建立 MockProvider 测试，确保无 PandaWiki 服务时开发测试仍可运行；
6. 通过 TypeScript typecheck、Mock Provider 单测、Provider lifecycle 测试后，再进入聊天或写入能力。
