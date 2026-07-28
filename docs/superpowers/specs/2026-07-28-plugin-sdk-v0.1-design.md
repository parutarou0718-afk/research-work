# Plugin SDK v0.1 设计

## 目标

将官方内置插件从“可注册的 React 页面”升级为通过稳定 Host API 工作的模块。插件不得直接导入核心 Zustand Store、Tauri 文件命令、核心路由或本地持久化实现。

## SDK 边界

核心向插件提供 `PluginHost`，包含：

- `project`：读取当前项目、订阅项目切换；
- `documents`：列出当前项目 Markdown 文档、读取受控文本、读取已索引来源路径；
- `storage`：按插件 ID 隔离的 JSON 存储；
- `settings`：按插件 ID 隔离的浏览器设置；
- `notifications`：成功、警告和错误通知；
- `navigation`：插件已有的声明式导航项；
- `commands`：仅定义声明式命令类型，本轮不建立全局命令面板；
- `lifecycle`：现有 activate/deactivate/data-recovery 机制。

不在 V0.1 加入全局 EventBus、SQLite 访问、任意 Tauri command、任意网络访问或 AI 调用。它们会在真实用例出现后作为独立、权限明确的能力加入。

## 插件创建方式

内置插件改为 `createPlugin(host)` 工厂。核心在注册前构造 Host，插件页面收到相同 Host 作为属性，因此业务 UI 不再读取 `useWikiStore` 或 `@/commands/fs`。

## 存储

插件数据写入：

```text
<project>/.llm-wiki/plugins/<plugin-id>/storage.json
```

`official.submission-management` 使用该位置。首次读取时，若新位置不存在而旧 `.llm-wiki/submissions.json` 存在，则读取、校验并迁移到新位置；旧文件不删除。插件被停用时不会调用删除 API，历史数据保持在插件目录中。

## 投稿插件迁移

投稿插件通过 SDK 获取当前项目、Markdown 文档和已索引来源；其持久化通过 `PluginStorage` 实现。恢复机制仍由插件框架协调：检测到记录先询问，恢复后才加载，暂不加载时禁止写入，防止覆盖历史数据。

## PandaWiki 联通审计

当前客户端真实已联通：认证、知识库列表、知识树和节点详情。OpenAI-compatible 问答服务端已经可用，但当前主聊天 UI 尚未使用该 Adapter。Document、conversation、search、graph 的 DTO/Mapper 或 capability 声明不能视为已完成联通；其中 Graph 当前明确未实现。

服务端大规模多文件方案应是异步解析、切块、向量索引和可选实体抽取。前端只读目录、节点详情、检索命中和引用，不承担多文件扫描或索引。实体和关系若落库，必须携带来源 chunk 与 `group_ids` 权限元数据。

## 验收

- 投稿插件不直接导入核心 Store 或文件命令。
- 数据保存在插件命名空间，旧投稿文件可兼容迁移。
- 插件停用后数据保留；恢复选择仍安全。
- Host API 与插件工厂具备单元测试。
- 类型检查、完整 Mock 测试和生产构建通过。
