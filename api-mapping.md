# PandaWiki API 映射与证据台账（Phase 0）

## 证据与状态定义

优先级依照需求：项目 API 文档 → 已验证 curl → 运行中 Swagger → 源码。本次运行环境的 `localhost:2443` 未监听，无法做 curl/Swagger 连通性验证；`backend/docs/swagger.json` 存在但包含无法解析的损坏字符串。因此本表以路由注册与 Go DTO 为准。

- **◐ 源码已定义**：路由和/或 DTO 在 PandaWiki 当前分支存在，未作运行时验证。
- **⏳ 未验证**：需求文件提及、但当前源码未找到同名可用接口，或语义/协议仍不确定。
- **✅ 仅在部署环境验证后使用**：本报告不把任何端点标为运行时已验证；下表的 Phase 1 候选端点需先以实际 token/curl 验证。

所有 API 返回都通过 PandaWiki 的 response envelope 包装；Phase 1 的 DTO 必须保留该 envelope，再由 mapper 解包，不能让其流入 UI。

## Phase 1 必需映射

| 模块 | PandaWiki API | research-work 功能 | 状态 | 关键事实/备注 |
|---|---|---|---|---|
| 认证 | `POST /api/v1/user/login` | Provider 登录 | ◐ 源码已定义 | 请求 `{account,password}`；响应 `data.token`。需求稿写的 `/api/v1/auth/login` 不存在。 |
| 会话身份 | `GET /api/v1/user` | 恢复后校验当前用户 | ◐ 源码已定义 | Bearer JWT；返回 id/account/role。 |
| 刷新令牌 | 无已发现路由 | `AuthProvider.refreshToken()` | ⏳ 未验证 | 契约可预留；PandaWiki adapter 不得实现假刷新。 |
| 知识库 | `GET /api/v1/knowledge_base/list` | 知识库选择 | ◐ 源码已定义 | 已认证；返回 id/name/dataset_id/access_settings。 |
| 知识库详情 | `GET /api/v1/knowledge_base/detail?kb_id=…` | 当前 KB 元数据/权限 | ◐ 源码已定义 | 需要 KB 权限。 |
| 节点树 | `GET /api/v1/node/list/group/nav?kb_id=…` | 知识树 | ◐ 源码已定义 | 返回按 Nav 分组的节点列表，不是现成递归 FileTree；Mapper 必须构树。 |
| 节点详情 | `GET /api/v1/node/detail?kb_id=…&id=…` | Markdown 内容/阅读页 | ◐ 源码已定义 | 返回 `content`、meta、父节点、权限等。 |
| 行业展示（可选） | `GET /share/v1/app/web/info` + `X-KB-ID` | 品牌/术语只读展示 | ◐ 源码已定义 | 返回安全 `edition` 展示字段；不是 Phase 1 的知识树依赖。 |

## 全量路由清单（当前 handler 源码）

下面列出当前分支所有可见 handler 路由。它是**接口清单**，不是对外兼容承诺；需要认证/KB 权限的端点不能由客户端自行模拟权限。

### `/api/v1` 受认证管理/API 路由

| 模块 | 方法与路径 | Provider/前端关联 |
|---|---|---|
| User | `POST /api/v1/user/login`; `GET /api/v1/user`; `GET /api/v1/user/list`; `POST /api/v1/user/create`; `PUT /api/v1/user/reset_password`; `DELETE /api/v1/user/delete` | Phase 1B 只需 login、current user。 |
| Knowledge base | `POST /api/v1/knowledge_base`; `GET /api/v1/knowledge_base/list`; `GET|PUT|DELETE /api/v1/knowledge_base/detail`; `GET /api/v1/knowledge_base/user/list`; `POST /invite`; `PATCH /update`; `DELETE /delete`; `POST /api/v1/knowledge_base/release`; `GET /release/list` | Phase 1C 只读 list/detail。 |
| Node | `GET /api/v1/node/list`; `GET /list/group/nav`; `GET /stats`; `POST /api/v1/node`; `GET|PUT /detail`; `POST /summary`; `POST /summary/stream`; `POST /action`; `POST /move`; `POST /move/nav`; `POST /batch_move`; `GET /recommend_nodes`; `POST /restudy`; `GET /permission`; `PATCH /permission/edit` | Phase 1C 只读 group/nav + detail。写入留到 DocumentProvider。 |
| Nav | `GET /api/v1/nav/list`; `POST /add`; `DELETE /delete`; `PATCH /update`; `POST /move` | 未来可用于更精确树构建。 |
| File | `POST /api/v1/file/upload`; `POST /upload/url`; `POST /upload/anydoc` | Phase 3 DocumentProvider 候选。 |
| Conversation | `GET /api/v1/conversation`; `GET /detail`; `GET /message/list`; `GET /message/detail` | 管理/历史读取；不是现有用户聊天流协议。 |
| Creation | `POST /api/v1/creation/text`; `POST /tab-complete` | 后续编辑辅助候选，协议待验证。 |
| Crawler | `POST /api/v1/crawler/parse`; `POST /export`; `GET /result`; `POST /results` | 后续导入，不纳入 Phase 1。 |
| Model | `GET /api/v1/model/list`; `POST /api/v1/model`; `POST /check`; `POST /provider/supported`; `PUT /api/v1/model`; `POST /switch-mode`; `GET /mode-setting` | 管理 API；research-work 终端用户不应管理。 |
| App | `GET /api/v1/app/detail`; `PUT|DELETE /api/v1/app` | 后台配置，不纳入。 |
| Auth configuration | `GET /api/v1/auth/get`; `POST /set`; `DELETE /delete` | 后台 SSO/来源配置，不等于用户登录。 |
| Comment | `GET /api/v1/comment`; `DELETE /api/v1/comment/list` | 后续可选。 |
| Statistics | `GET /api/v1/stat/instant_count`; `/instant_pages`; `/count`; `/geo_count`; `/conversation_distribution`; `/hot_pages`; `/referer_hosts`; `/browsers` | 不纳入。 |
| Edition | `GET /api/v1/system/edition`; `PUT /api/v1/system/edition` | 读取可支持展示；写入仅 admin。 |
| Report user | `GET /api/v1/report-profiles`; `POST /api/v1/reports`; `GET /api/v1/reports`; `GET /api/v1/reports/:id` | 已有安全报告流程；本计划不接入 Phase 1。 |
| Report admin | `GET|POST /api/v1/admin/report-profiles`; `GET|PUT|DELETE /api/v1/admin/report-profiles/:id`; `PATCH /:id/enabled`; `POST /:id/restore-default` | Admin-only；不暴露给普通前端流程。 |

### `/share/v1` 公开/分享路由

| 模块 | 方法与路径 | 备注 |
|---|---|---|
| App | `GET /share/v1/app/web/info`; `/widget/info`; `/wechat/info`; `GET|POST /wechat/official_account`; `GET|POST /wechat/service`; `GET /wechat/service/answer`; `GET|POST /wechat/app`; `GET|POST /wecom/ai_bot` | `web/info` 已带安全 Edition 展示字段。 |
| Share auth | `GET /share/v1/auth/get`; `POST /login/simple`; `POST /github` | 面向分享访问；不是替代 `/api/v1/user/login` 的企业客户端认证方案。 |
| Captcha | `POST /share/v1/captcha/challenge`; `/redeem` | 公开上传/访问辅助。 |
| Chat | `POST /share/v1/chat/message`; `/search`; `/completions`; `/widget`; `/widget/search`; `/feedback` | 对话/SSE 载荷和授权模型需 Phase 4 curl 验证。 |
| Node/Nav | `GET /share/v1/node/list`; `/detail`; `GET /share/v1/nav/list` | 受分享认证；可作为公共阅读模式候选，不能替代已登录用户 API 的权限语义。 |
| Conversation | `GET /share/v1/conversation/detail` | 分享侧历史。 |
| Comment | `POST /share/v1/comment`; `GET /list` | 公开评论。 |
| Common | `POST /share/v1/common/file/upload`; `/file/upload/url` | 分享侧上传。 |
| Statistics | `POST /share/v1/stat/page` | 页面统计。 |
| OpenAPI | `POST /share/v1/openapi/lark/bot/:kb_id` | Lark bot。 |
| Sitemap | `GET /sitemap.xml` | 站点地图。 |

## DTO 真实性与缺口

| DTO 文件（Phase 1A） | 可从当前源码严格定义的部分 | 仍需验证的部分 |
|---|---|---|
| `AuthDTO.ts` | login、current user、Bearer token response。 | refresh token、cookie/SSO 续期。 |
| `KnowledgeDTO.ts` | KB list/detail 的 `id/name/dataset_id/access_settings`。 | envelope 错误码与分页的实际 JSON。 |
| `NodeDTO.ts` | list/group/nav、detail 的字段；请求 `kb_id`、`id`。 | `NodeListGroupNav` 的实际排序、树层级语义。 |
| `ConversationDTO.ts` | 管理 conversation list/detail 的类型名可定位。 | 用户 chat/SSE endpoint、chunk framing、取消方式。 |
| `DocumentDTO.ts` | 上传路由存在。 | 上传后的任务状态、下载、文件与 Node 对应关系。 |
| `GraphDTO.ts` | 无已验证图谱路由。 | 应保持空类型占位，不宣称可用。 |
| `TemplateDTO.ts` | ReportProfile 管理/用户接口存在。 | 其是否等同于 research-work 模板需求；Phase 5 再审计。 |

## Phase 1 连通性验收（不在本阶段执行）

在测试部署中依次验证：登录响应 envelope、`Authorization: Bearer`、`GET /api/v1/user`、KB list、Node group/nav、Node detail；再确认 CORS/Tauri HTTP、401/403/404、取消请求和 token 不进入日志。只有这些通过后，才把相应端点从“◐ 源码已定义”升级为“✅ 已验证”。
