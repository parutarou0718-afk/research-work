import type { LlmWikiPlugin, PluginId, PluginNavigationItem } from "./types"

const ENABLED_PLUGINS_STORAGE_KEY = "llm-wiki.enabled-plugins.v0.1"

function readEnabledPluginIds(): Set<PluginId> {
  try {
    const saved = JSON.parse(localStorage.getItem(ENABLED_PLUGINS_STORAGE_KEY) ?? "[]")
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : [])
  } catch {
    return new Set()
  }
}

export class PluginRegistry {
  private readonly plugins = new Map<PluginId, LlmWikiPlugin>()
  private readonly enabledPluginIds = readEnabledPluginIds()

  register(plugin: LlmWikiPlugin): void {
    if (this.plugins.has(plugin.manifest.id)) {
      throw new Error(`Plugin '${plugin.manifest.id}' is already registered.`)
    }
    this.plugins.set(plugin.manifest.id, plugin)
    if (plugin.manifest.defaultEnabled && !localStorage.getItem(ENABLED_PLUGINS_STORAGE_KEY)) {
      this.enabledPluginIds.add(plugin.manifest.id)
      this.persistEnabledPlugins()
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

  async enablePlugin(id: PluginId): Promise<void> {
    const plugin = this.requirePlugin(id)
    this.enabledPluginIds.add(id)
    this.persistEnabledPlugins()
    await this.runLifecycle(plugin.activate, id, "activate")
  }

  async disablePlugin(id: PluginId): Promise<void> {
    const plugin = this.requirePlugin(id)
    this.enabledPluginIds.delete(id)
    this.persistEnabledPlugins()
    await this.runLifecycle(plugin.deactivate, id, "deactivate")
  }

  async activateEnabledPlugins(): Promise<void> {
    for (const plugin of this.getEnabledPlugins()) {
      await this.runLifecycle(plugin.activate, plugin.manifest.id, "activate")
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

  private async runLifecycle(
    lifecycle: LlmWikiPlugin["activate"],
    id: PluginId,
    operation: "activate" | "deactivate",
  ): Promise<void> {
    try {
      await lifecycle?.()
    } catch (error) {
      console.error(`[plugins] failed to ${operation} '${id}'`, error)
    }
  }
}
