import { Switch } from "@base-ui/react/switch"
import { usePlugins } from "@/core/plugins/usePlugins"

export function PluginsSection() {
  const { plugins, isPluginEnabled, enablePlugin, disablePlugin } = usePlugins()

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">功能模块</h2>
        <p className="mt-1 text-sm text-muted-foreground">启用或关闭官方内置功能模块。关闭不会删除已有数据。</p>
      </div>
      <div className="divide-y rounded-lg border">
        {plugins.map((plugin) => {
          const enabled = isPluginEnabled(plugin.manifest.id)
          return (
            <div key={plugin.manifest.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="font-medium">{plugin.manifest.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{plugin.manifest.description}</p>
              </div>
              <Switch.Root
                checked={enabled}
                onCheckedChange={(checked) => void (checked ? enablePlugin(plugin.manifest.id) : disablePlugin(plugin.manifest.id))}
                className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-muted transition-colors data-[checked]:bg-primary"
                aria-label={`${enabled ? "Disable" : "Enable"} ${plugin.manifest.name}`}
              >
                <Switch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-background transition-transform data-[checked]:translate-x-5" />
              </Switch.Root>
            </div>
          )
        })}
      </div>
    </section>
  )
}
