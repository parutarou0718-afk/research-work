import { useContext } from "react"
import { PluginContext, type PluginContextValue } from "./PluginProvider"

export function usePlugins(): PluginContextValue {
  const context = useContext(PluginContext)
  if (!context) throw new Error("usePlugins must be used inside PluginProvider.")
  return context
}
