# Enterprise LLM Wiki：仓库兼容性审计（Phase 0）

审计日期：2026-07-24  
审计范围：`research-work` 的 `feature/submission-management` 分支，以及本地 PandaWiki `agent/edition-config-v1` 分支。  
限制：本报告只读分析；未修改 PandaWiki 或 research-work 源码。

## 结论

**可以采用 PandaWiki 作为知识库、身份认证、权限过滤、RAG 与报告生成的后端底座，并把 research-work 作为唯一用户界面。** 但这不是把现有本地文件请求换成一个 URL 的小改动：research-work 当前是一个以 Tauri 本地目录、项目文件树、客户端 LLM、客户端 embedding/ingest 为中心的应用。PandaWiki 则以知识库（KB）、导航（Nav）、节点（Node）、服务端鉴权与权限过滤检索为中心。

可行的 V1 切线是：

1. research-work 保留壳、布局、编辑/阅读表现层与提交管理 UI；
2. 新增 Provider 边界，先只接入**登录、知识库列表、节点树、节点详情的只读加载**；
3. PandaWiki 成为唯一的远端知识来源；不把 PandaWiki 的 DTO 或 token 泄漏进 Zustand Store/UI；
4. 本地 Provider 只能是显式选择的开发/个人模式，PandaWiki 失败时不自动退回本地；
5. 写入、上传、对话流、图谱、提交管理同步均不属于 Phase 1，必须在各自能力接口与 API 经验证后再接入。

因此，目标应表述为“research-work 是唯一**前端/桌面客户端**”，而不是“研究项目的本地目录仍是知识库真源”。对于接入 PandaWiki 的工作区，KB/Node 才是真源。

## 事实校正与接入前门槛

| 项目 | 审计结果 | 影响 |
|---|---|---|
| 后端框架 | 实际为 Echo（见 `PandaWiki-main/backend/server/http/http.go`），不是需求稿中写的 Gin。 | 前端无直接影响；后续 API/中间件审计应以代码为准。 |
| 登录路由 | 实际为 `POST /api/v1/user/login`，请求字段为 `account`、`password`，响应为 `{ data: { token } }`。见 `backend/handler/v1/user.go`、`backend/api/user/v1/user.go`。 | 需求稿中的 `/api/v1/auth/login` 不可直接实现。Phase 1B DTO/API 必须修正。 |
| 刷新令牌 | 静态代码只发现 JWT 登录与用户信息接口，**没有发现** refresh-token 路由。 | `AuthProvider.refreshToken()` 可先保留契约，但 PandaWiki 实现不得伪造；需要后端能力确认或将会话策略改为重新登录。 |
| CORS | 公开 `share/v1/app` 路由单独允许 `*`；主 `/api/v1` 的 `NewEcho` 未注册全局 CORS。见 `backend/handler/share/app.go`、`backend/server/http/http.go`。 | 浏览器版 research-work 跨域调用受阻的风险高；Tauri HTTP 插件仍需部署和证书验证。必须在不改变认证安全性的前提下确认反向代理/CORS 策略。 |
| 在线验证 | `localhost:2443` 在本机未监听；无法读取 Docker 运行时 Swagger 或执行 curl 验证。 | 本报告的“已实现”指源码已定义，并非运行时连通性证明。 |
| Swagger | `backend/docs/swagger.yaml/json` 存在，但本分支 `swagger.json` 无法由 PowerShell JSON 解析（有损坏字符串）。 | API 盘点以 handler 注册与 Go DTO 为准；部署前应重新生成/修复 Swagger。 |

## 1. 可原样保留的模块

这些模块不直接决定知识后端，可以在 Phase 1 保持现状；仅在后续功能需要远端数据时再调整。

| 目录/文件 | 保留原因 |
|---|---|
| `src/components/ui/*` | Button、Dialog、Input、ScrollArea 等通用 UI 原语，与数据源无关。 |
| `src/components/error-boundary.tsx` | 通用错误边界。 |
| `src/components/mermaid-diagram.tsx` | Markdown 内图表渲染，与数据来源无关。 |
| `src/components/submissions/*` | 投稿状态、筛选与展示是本分支的独立功能；Phase 1 不把它错误绑定到 PandaWiki。当前持久化位置另见冲突表。 |
| `src/types/submission.ts` | 提交领域类型，与知识库 DTO 分离。 |
| `src/stores/activity-store.ts`、`lint-store.ts`、`review-store.ts`、`update-store.ts`、`zoom-store.ts` | UI 活动、审阅、更新、缩放等本地界面状态；只需防止它们把 PandaWiki Node 路径当成本地路径。 |
| `src/components/layout/app-layout.tsx`、`content-area.tsx`、`icon-sidebar.tsx` | 布局容器可保留；后续仅通过 Provider capability 控制入口。 |
| `src/i18n/*`、`src/index.css`、`src/main.tsx` | 文案、样式、启动挂载。 |
| `src/lib/file-types.ts`、`frontmatter.ts`、`markdown-image-resolver.ts`、`natural-sort.ts`、`utils.ts`、`theme.ts` | 可作为纯前端格式/显示辅助保留；任何依赖绝对项目路径的调用须在 Provider 模式下禁用或替换。 |

## 2. 必须改为通过 Provider 获取数据的模块

| 文件/模块 | 现状 | Provider 化要求 |
|---|---|---|
| `src/App.tsx` | 启动时恢复本地项目、LLM/embedding 配置、文件同步、ingest 队列和本地聊天历史。 | Phase 1B 增加 Provider 初始化与认证门；PandaWiki 模式不得启动本地 ingest、文件监控或把 KB 当作本地 project。 |
| `src/stores/wiki-store.ts` | `project`、`fileTree`、`selectedFile`、`fileContent`、LLM/embedding 配置混在一个 Store。 | Phase 1C 把远端 KB/Node 的加载集中到 Provider-aware action；保持 DTO 不进入 Store；逐步把本地项目专属状态隔离。 |
| `src/components/layout/file-tree.tsx` | 以 `FileNode.path` 和本地项目目录呈现。 | PandaWiki 模式改消费 `FileTreeModel`，节点 id 不可伪装为本机路径。 |
| `src/components/layout/knowledge-tree.tsx` | 使用 `listDirectory`、`readFile` 扫描本地 Markdown。 | Phase 1C 直接读取 `KnowledgeProvider.getNodeTree()`；点击后调用 `getNode(id)`。 |
| `src/components/layout/preview-panel.tsx`、`src/components/editor/file-preview.tsx`、`wiki-reader.tsx` | 以 `readFile(path)` 加载正文。 | 改使用 `NodeModel.content`；图片/附件 URL 需后端安全 URL 方案后再支持。 |
| `src/components/editor/wiki-editor.tsx`、`page-links-panel.tsx`、`frontmatter-panel.tsx` | 本地文件写入、wikilink、局部 LLM 修改。 | Phase 1 只读时隐藏或只读化；后续必须由 `DocumentProvider`/Node 写接口承担，不能调用 Tauri FS。 |
| `src/components/chat/chat-panel.tsx`、`chat-message.tsx`、`agent-file-activity.tsx` | 直接使用 `llm-client`、Tauri agent 和本地文件上下文。 | Phase 4 由 `ConversationProvider` 接管；不可把本地 Agent 的文件写操作投射到 PandaWiki。 |
| `src/components/search/search-view.tsx`、`sources/sources-view.tsx` | 本地文件和本地索引检索。 | Phase 1 不接；后续仅由 `SearchProvider`/PandaWiki 受权限检索实现。 |
| `src/components/graph/graph-view.tsx` | 读取本地 Markdown 与本地 wiki graph。 | Phase 6 前维持 Local-only 或隐藏；PandaWiki 当前 Provider capability 应为 `graph: false`。 |
| `src/components/layout/research-panel.tsx`、`src/components/lint/*`、`src/components/review/*` | 使用本地 LLM、文件、网络搜索或持久化。 | 保留 UI，但在 PandaWiki Provider 下按 capability 明确禁用；不能静默调用本地模型。 |
| `src/components/settings/sections/llm-provider-section.tsx`、`embedding-section.tsx`、`api-server-section.tsx` 等 | 管理客户端 API Key、模型、embedding、导入服务。 | 企业 PandaWiki 模式中替换为只读 Provider 连接状态；不得让终端用户输入 PandaWiki 后端模型密钥。 |
| `src/commands/fs.ts`、`src/commands/file-sync.ts` | Tauri 本地文件系统命令。 | 只供显式 `local` Provider；禁止在 PandaWiki 数据通路中调用。 |

## 3. Phase 1 需要新增的模块

新增位置均为 `src/services/providers/`（详见 `integration-plan.md`）：

- 能力小接口：`AuthProvider`、`KnowledgeProvider`，以及未实现的 Conversation/Document/Graph/Template/Search 契约；
- `ProviderLifecycle`、`ProviderCapabilities`、`ProviderBundle`；
- `ProviderManager` 与 Provider-scoped Store 清理协调；
- 开发/测试专用 `MockProvider`；
- `pandawiki/dto/*` 纯传输类型；
- `pandawiki/mapper/*`，唯一允许 DTO 转 Domain Model 的位置；
- PandaWiki HTTP client、Auth API、Knowledge API、Node API；
- `ProviderLogin`、`ProviderSettings`、部署 Provider 配置；
- 明确的认证会话存储抽象（桌面安全存储；Web 只接受安全 Cookie，不能默认 localStorage JWT）。

## 4. Zustand 状态冲突清单

| Store | 会冲突的状态 | 风险与处理 |
|---|---|---|
| `wiki-store.ts` | `project`, `fileTree`, `projectPathIndex`, `selectedFile`, `fileContent`, `previewContentPath` | PandaWiki Node 不是本地 `path`。新增独立的 provider/Kb/node identity；不要把 node id 伪装为文件绝对路径。 |
| `wiki-store.ts` | `llmConfig`, `globalLlmConfig`, `providerConfigs`, `embeddingConfig`, `taskModelRouting`, `projectLlmOverride` | PandaWiki 模式下模型与 embedding 由后端负责。保留 Local provider 的配置，但企业模式不应驱动服务端知识查询。 |
| `wiki-store.ts` | `sourceWatchConfig`, `scheduledImportConfig`, `dataVersion` | 本地目录监听/导入与 PandaWiki 文档生命周期冲突。Phase 1 禁用；后续由 DocumentProvider 的服务端状态替代。 |
| `chat-store.ts` | 本地 conversation/message、上下文文件路径、agent 文件变更 | PandaWiki conversation id、引用和流事件应是独立模型；不能与本地 `.llm-wiki` 聊天记录合并。 |
| `file-sync-store.ts` | 本地文件同步状态 | PandaWiki 模式无本地镜像时必须清空/停止。 |
| `research-store.ts` | 本地研究任务与文件路径 | 可暂保留本地功能，但不得把它产生的本地引用当作 PandaWiki 授权资料。 |
| `review-store.ts` / `lint-store.ts` | 与文件路径、内容哈希绑定的审阅/检查项 | 先保留 Local-only；远端 Node 需要新的 id/version 锚点后才能接。 |
| `submission-store.ts` | 使用 `submission-persist.ts`，按 `projectPath` 写本地文件 | 投稿管理可保留，但 PandaWiki 工作区没有 `projectPath`。Phase 1 要么不在远端工作区显示，要么后续定义独立后端，不可复用 KB id 作为路径。 |

## 5. `src/lib` 与 PandaWiki 重叠的能力

| research-work 模块 | 与 PandaWiki 的重叠 | 处理 |
|---|---|---|
| `llm-client.ts`、`llm-providers.ts`、`llm-task-routing.ts`、`claude-cli-transport.ts`、`codex-cli-transport.ts`、`azure-openai.ts` | PandaWiki 已有服务端模型配置、聊天/RAG/摘要/报告链路。 | Local Provider 保留；PandaWiki Provider 不调用它们。 |
| `embedding.ts`、`dedup*`、`text-chunker.ts` | PandaWiki 负责服务端文档处理与向量化。 | PandaWiki Provider 禁用；不要双向量化。 |
| `ingest*.ts`、`source-*`、`project-file-sync.ts`、`scheduled-import.ts`、`url-source-import.ts`、`mineru.ts` | PandaWiki 有文件上传、URL 上传、节点和文档处理路径。 | Phase 3 前不接；未来由 DocumentProvider 映射后端处理状态。 |
| `search.ts`、`anytxt-search.ts` | PandaWiki 有 RAG 检索与公开/私有聊天搜索。 | Phase 4/后续使用后端受权限接口；禁止客户端全量本地搜索作为故障 fallback。 |
| `wiki-graph.ts`、`graph-*`、`enrich-wikilinks.ts` | PandaWiki 目前没有与该本地图谱同等的已验证图谱 API。 | 不接入 Phase 1；保留 `graph: false`。 |
| `persist.ts`、`project-store.ts`、`submission-persist.ts` | PandaWiki 有自己的数据库真源。 | 仅持久化 UI 偏好与 Local Provider 数据；不得缓存远端授权数据作为副本真源。 |
| `chat-save-to-wiki.ts`、`wiki-page-*`、`wiki-cleanup.ts` | PandaWiki 节点创建/更新的服务端语义不同。 | Phase 1 不复用；未来经 DocumentProvider/Node 写 API 实现。 |

## 推荐的 Provider 边界

```text
PandaWiki HTTP JSON/SSE
        ↓ DTO
PandaWiki API adapter
        ↓ Mapper（唯一 DTO→Model 位置）
Domain Model
        ↓
Provider-aware Zustand actions
        ↓
research-work UI
```

UI、Store、`src/types/wiki.ts` 不得导入 `pandawiki/dto/*`。Provider 切换应取消请求/流、清空 provider-scoped knowledge/chat 状态、dispose 旧 Provider、initialize 新 Provider、再加载工作区；不得发生透明本地 fallback。

## Phase 1 之外的明确排除项

- 不把 PandaWiki 管理端或公开 Wiki 前端嵌入 research-work；
- 不修改 PandaWiki Go 后端；
- 不迁移本地项目目录、`.llm-wiki` 数据、上传源或聊天历史；
- 不接入本地 LLM/embedding 作为 PandaWiki 的兜底；
- 不实现写节点、上传、聊天、搜索、图谱、报告模板或投稿同步；
- 不创建巨型 `IKnowledgeProvider`，也不引入 Event Bus。
