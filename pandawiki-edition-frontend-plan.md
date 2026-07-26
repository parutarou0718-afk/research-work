# PandaWiki × research-work：实测结论与行业版前端计划

更新日期：2026-07-24

## 1. 本次真实联调结论

research-work 已在桌面端（Tauri）以 `http://192.168.0.176:2444` 为 PandaWiki 后端完成真实登录，并实测通过：

1. PandaWiki 用户登录与当前用户读取；
2. 授权知识库列表读取；
3. 知识库节点树读取；
4. 两个不同节点的详情/正文读取与切换。

因此，**PandaWiki 可以作为 research-work 的知识库与认证后端底座**。目前已接通的范围仅是“认证 + 知识库浏览”，而不是 research-work 全部功能。

## 2. 当前范围与已知边界

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| 登录、登出、会话保存 | 已实现并实测 | Tauri 仅保存 Token，不保存密码。 |
| 知识库列表、节点树、节点详情 | 已实现并实测 | 通过 PandaWiki API 与 DTO → Mapper → Domain Model 边界。 |
| 节点正文排版 | 需收尾 | PandaWiki 当前返回 HTML；research-work 现按 Markdown 显示，HTML 标签会作为文本出现。需要增加安全的 HTML→受限展示模型转换，不能直接注入未净化 HTML。 |
| 普通只读用户浏览 | 待验证/可能受阻 | PandaWiki 当前节点读取路由要求 `DocManage` 权限；本次以 `admin` 验证成功。若产品需要普通阅读者使用，应由 PandaWiki 提供相应的受限读取权限/API，前端不能绕过。 |
| PandaWiki 对话/RAG | 未接入 | 后续由 `ConversationProvider` 实现，不应调用 research-work 本地 LLM。 |
| 上传、解析、编辑 | 未接入 | 后续由 `DocumentProvider`/Node 写入能力实现。 |
| 搜索、图谱、模板 | 未接入 | 分别需要 PandaWiki 对应安全 API 与 Provider 能力。 |

> 安全提示：实测的知识库正文中出现了类似访问密钥的敏感内容。该内容应从文档中移除并轮换相关密钥；前端不应把这类内容写入日志、测试输出或错误信息。

## 3. 行业版前端结论：只维护一个前端

不要为 `common`、`research`、`legal`、`finance` 各维护一套 research-work 前端。

推荐结构：

```text
PandaWiki EditionConfig（部署级唯一真相）
  → 安全的 PublicEditionConfig
  → PandaWikiProvider DTO
  → EditionPresentation Domain Model
  → Theme tokens / terminology / feature gates
  → 同一套 research-work UI
```

前端不应在各页面散落 `edition_id === "legal"` 一类判断。应统一消费：

- `product_name`、`short_name`、`branding.logo`、`home_description`；
- `terminology`（例如“知识库”“案件资料”“财报”的界面名称）；
- `enabled_features`（仅控制 UI 可见性，不替代后端鉴权）；
- `document_types`、`relation_types`；
- `edition_id` 和 `edition_version`（用于可观测性、兼容分支与缓存键）。

禁止前端读取或保存 `default_prompts`、管理员 overrides、审计字段或任何系统内部配置。

## 4. 后端部署前置条件

PandaWiki 的 `agent/edition-config-v1` 分支已具备安全字段模型：`PublicEditionConfig`。其 `GET /share/v1/app/web/info` 会在携带 `X-KB-ID` 的有效请求中返回 `data.edition`。

研究客户端接入前需完成：

1. 将包含 EditionConfig 的 PandaWiki 版本部署到 `192.168.0.176:2444`；
2. 以有效知识库标识调用 `GET /share/v1/app/web/info`，确认响应中有 `data.edition`；
3. 确认仅包含公开允许字段：
   `edition_id`、`edition_version`、`product_name`、`short_name`、`branding`、`home_description`、`terminology`、`enabled_features`、`document_types`、`relation_types`；
4. 在切换 Edition 后重新获取配置；缓存键必须包含 `edition_version`；
5. 接口异常或 `edition` 缺失时，在客户端使用内置 `common` 展示配置，且不得阻断知识库浏览。

## 5. 推荐实施顺序

### 阶段 A：完成知识库阅读收尾

1. 在 PandaWiki DTO/Mapper 边界识别 HTML 正文；
2. 将正文转换为安全、受限的渲染模型（不使用未净化 `dangerouslySetInnerHTML`）；
3. 修正节点 `type`、`status` 的实际数值类型映射与 `meta.summary` 映射；
4. 用管理员和最低权限阅读用户各做一次真实联调。

验收：目录、正文、图片/链接的安全展示可用；未经授权的节点不会显示或泄露。

### 阶段 B：EditionPresentation Provider 能力

1. 新增只读 `EditionProvider` 或归入最小 `AppInfoProvider`；
2. 定义 PandaWiki `PublicEditionDTO` 与 `EditionPresentation`；
3. 通过 Mapper 进入 Store/UI，DTO 不越界；
4. 缺失/异常时回退 `common`，不做 PandaWiki→本地知识库 fallback。

验收：切换 PandaWiki 的 common/research/legal/finance 后，同一 research-work 构建可读取正确配置。

### 阶段 C：统一品牌、术语与样式 Token

1. 在应用壳层应用产品名、Logo、首页说明；
2. 用 `terminology` 替换核心通用文字；
3. 用 CSS variables/主题 token 控制颜色、Logo 和密度；
4. 行业差异保持为配置，不复制页面。

验收：同一二进制/同一前端构建切换 Edition 后，品牌与术语更新，无四套 UI。

### 阶段 D：功能门控与行业模板

1. 只用 `enabled_features` 控制入口可见性；
2. 后端继续作为权限与可用性的最终裁决者；
3. 接入 PandaWiki 已有 ReportProfile 安全列表，按当前 Edition 返回模板；
4. 逐项接入对话、搜索、上传，均经能力接口实现。

验收：前端不自行推断行业、不泄露 Prompt、不绕过 PandaWiki 的用户/组权限。

## 6. 发布策略

1. 先以 `common` Edition 发布研究客户端的阅读模式；
2. 再切到 `research`，验证术语、品牌和报告模板筛选；
3. 用独立低权限账号测试节点读取和未来 RAG 权限；
4. 最后启用 `legal`、`finance`；敏感资料先完成云模型数据边界评估。

## 7. 结论

当前实测证明集成方向正确：**PandaWiki 做后端，research-work 做唯一前端** 是可行的。行业差异应由 PandaWiki 的 EditionConfig 驱动同一前端的配置、主题和术语，而不是维护多个行业前端仓库。
