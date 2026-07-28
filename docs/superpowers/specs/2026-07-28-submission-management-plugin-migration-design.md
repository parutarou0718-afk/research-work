# 投稿管理官方插件迁移设计

## 目标

将现有投稿管理功能从应用核心目录完整迁移到 `src/plugins/submission-management/`，使核心只保留通用插件框架。迁移后，关闭或“删除”插件只隐藏入口并清空运行时状态，绝不删除 `.llm-wiki/submissions.json` 中的项目数据。

## 方案选择

采用“内置插件、数据保留、显式恢复”方案：投稿功能的类型、持久化、Zustand Store、界面和测试均归属插件目录；核心通过插件的 `dataRecovery` 能力判断历史数据是否存在。重新启用时，若当前项目存在历史数据，设置页先询问用户“恢复并同步历史数据”或“暂不加载历史数据”。后者不会删除文件；停用后再次启用会再次询问。

不采用彻底卸载方案，因为它会删除用户记录；也不采用自动恢复方案，因为用户明确要求在重新启用时获得选择权。

## 架构与数据流

1. `LlmWikiPlugin` 可选声明 `dataRecovery`：检查历史数据、准备恢复、清理运行时数据。
2. `PluginProvider` 管理每个插件的恢复状态：`idle`、`needs-decision`、`restored`、`deferred`。
3. 启用插件时，Provider 先启用导航；若发现历史数据，将状态设为 `needs-decision`，不自动读取记录。
4. 设置页显示通用恢复确认界面。用户选择恢复后，Provider 将状态设为 `restored`；选择暂不加载后设为 `deferred`。
5. 投稿页面仅在 `restored` 状态下调用插件 Store 的 `hydrate`。在 `needs-decision` 状态下显示同样的恢复选择；在 `deferred` 状态下显示空的本次会话，不读取旧文件。
6. 停用插件时调用 `deactivate` 清空其内存 Store；磁盘数据不写入、不删除。导航项立即隐藏。
7. 项目切换时，Provider 先清空所有已启用插件的运行时数据，再检查新项目是否存在历史数据，避免跨项目显示旧记录。

## 文件边界

`src/core/plugins/` 只定义通用数据恢复协议与状态协调，不知道投稿领域模型、文件名或存储实现。全部投稿专有代码移至 `src/plugins/submission-management/`：`domain/`、`store/`、`persistence/`、`components/`。核心布局只通过插件路由渲染页面，不再包含 `submissions` 视图、导航项或 Store 引用。

## 数据兼容

保留项目级路径 `.llm-wiki/submissions.json` 与 `version: 1` JSON 格式不变。此次迁移不做数据迁移、不修改已有记录。插件停用、重新启用、应用重启或项目切换都不得删除该文件。

## 验收

- 投稿管理不再由 `src/components`、`src/stores`、`src/lib`、`src/types` 核心目录实现或直接引用。
- 停用插件后导航隐藏且运行时记录清空，磁盘文件保留。
- 历史数据存在时重新启用出现恢复选择；恢复后加载旧记录，暂不加载时不读取旧记录。
- 再次停用并启用时仍可恢复原数据。
- 现有投稿逻辑测试、插件测试、类型检查和构建均通过。
