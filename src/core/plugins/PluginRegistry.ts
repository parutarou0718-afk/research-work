import type {
  LlmWikiPlugin,
  PluginDataRecoveryDecision,
  PluginId,
  PluginNavigationItem,
} from "./types"

const ENABLED_PLUGINS_STORAGE_KEY = "llm-wiki.enabled-plugins.v0.1"
const APPLIED_DEFAULT_PLUGINS_STORAGE_KEY = "llm-wiki.applied-default-plugins.v0.1"

function readPluginIds(storageKey: string): Set<PluginId> {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [])
  } catch {
    return new Set()
  }
}

export class PluginRegistry {
  private readonly plugins = new Map<PluginId, LlmWikiPlugin>()
  private readonly enabledPluginIds = readPluginIds(ENABLED_PLUGINS_STORAGE_KEY)
  private readonly appliedDefaultPluginIds = readPluginIds(APPLIED_DEFAULT_PLUGINS_STORAGE_KEY)
  private readonly pendingDataRecoveryPluginIds = new Set<PluginId>()
  private readonly dataRecoveryStates = new Map<PluginId, "pending" | "deferred">()

  register(plugin: LlmWikiPlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin '${plugin.manifest.id}' is already registered.`)
    }
    this.plugins.set(plugin.manifest.id, plugin)
    if (plugin.manifest.defaultEnabled && !this.appliedDefaultPluginIds.has(plugin.manifest.id)) {
      this.enabledPluginIds.add(plugin.manifest.id)
      this.appliedDefaultPluginIds.add(plugin.manifest.id)
      this.persistEnabledPlugins()
      this.persistAppliedDefaultPlugins()
    }
  }

  getPlugin(id: PluginId): LlmWikiPlugin | undefined {
    return this.plugins.get(id)
  }

  getAllPlugins(): LlmWikiPlugin[] {
    return [...this.plugins.values()]
  }

  getEnabledPlugins(): LlmWikiPlugin[] {
    return this.getAllPlugins().filter((plugin) => this.isPluginEnabled(plugin.manifest.id))
  }

  getPluginNavigationItems(): PluginNavigationItem[] {
    return this.getEnabledPlugins()
      .flatMap((plugin) => plugin.navigationItems ?? [])
      .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
  }

  isPluginEnabled(id: PluginId): boolean {
    return this.enabledPluginIds.has(id)
  }

  isPluginDataRecoveryPending(id: PluginId): boolean {
    return this.pendingDataRecoveryPluginIds.has(id)
  }

  getPluginDataRecoveryState(id: PluginId): "ready" | "pending" | "deferred" {
    return this.dataRecoveryStates.get(id) ?? "ready"
  }

  async enablePlugin(id: PluginId): Promise<void> {
    const plugin = this.requirePlugin(id)
    this.enabledPluginIds.add(id)
    this.persistEnabledPlugins()
    await this.runLifecycle(plugin.activate, id, "activate")
    await this.prepareDataRecovery(plugin)
  }

  async disablePlugin(id: PluginId): Promise<void> {
    const plugin = this.requirePlugin(id)
    this.enabledPluginIds.delete(id)
    this.pendingDataRecoveryPluginIds.delete(id)
    this.dataRecoveryStates.delete(id)
    this.persistEnabledPlugins()
    await this.runLifecycle(plugin.dataRecovery?.clearRuntimeData, id, "clear runtime data")
    await this.runLifecycle(plugin.deactivate, id, "deactivate")
  }

  async resolvePluginDataRecovery(id: PluginId, decision: PluginDataRecoveryDecision): Promise<void> {
    const plugin = this.requirePlugin(id)
    if (!this.pendingDataRecoveryPluginIds.has(id) || !plugin.dataRecovery) return

    try {
      await (decision === "restore" ? plugin.dataRecovery.restore() : plugin.dataRecovery.defer())
      this.pendingDataRecoveryPluginIds.delete(id)
      if (decision === "restore") {
        this.dataRecoveryStates.delete(id)
      } else {
        this.dataRecoveryStates.set(id, "deferred")
      }
    } catch (error) {
      console.error(`[plugins] failed to ${decision} historical data '${id}'`, error)
    }
  }

  async activateEnabledPlugins(): Promise<void> {
    for (const plugin of this.getEnabledPlugins()) {
      await this.runLifecycle(plugin.activate, plugin.manifest.id, "activate")
      await this.prepareDataRecovery(plugin)
    }
  }

  async refreshEnabledPluginDataRecovery(): Promise<void> {
    for (const plugin of this.getEnabledPlugins()) {
      this.pendingDataRecoveryPluginIds.delete(plugin.manifest.id)
      this.dataRecoveryStates.delete(plugin.manifest.id)
      await this.runLifecycle(plugin.dataRecovery?.clearRuntimeData, plugin.manifest.id, "clear runtime data")
      await this.prepareDataRecovery(plugin)
    }
  }

  private async prepareDataRecovery(plugin: LlmWikiPlugin): Promise<void> {
    const recovery = plugin.dataRecovery
    if (!recovery) return

    try {
      if (await recovery.hasHistoricalData()) {
        this.pendingDataRecoveryPluginIds.add(plugin.manifest.id)
        this.dataRecoveryStates.set(plugin.manifest.id, "pending")
      } else {
        this.dataRecoveryStates.delete(plugin.manifest.id)
      }
    } catch (error) {
      console.error(`[plugins] failed to inspect historical data for '${plugin.manifest.id}'`, error)
    }
  }

  private requirePlugin(id: PluginId): LlmWikiPlugin {
    const plugin = this.plugins.get(id)
    if (!plugin) throw new Error(`Plugin '${id}' is not registered.`)
    return plugin
  }

  private persistEnabledPlugins(): void {
    localStorage.setItem(ENABLED_PLUGINS_STORAGE_KEY, JSON.stringify([...this.enabledPluginIds]))
  }

  private persistAppliedDefaultPlugins(): void {
    localStorage.setItem(APPLIED_DEFAULT_PLUGINS_STORAGE_KEY, JSON.stringify([...this.appliedDefaultPluginIds]))
  }

  private async runLifecycle(
    lifecycle: LlmWikiPlugin["activate"],
    id: PluginId,
    operation: string,
  ): Promise<void> {
    try {
      await lifecycle?.()
    } catch (error) {
      console.error(`[plugins] failed to ${operation} '${id}'`, error)
    }
  }
}
