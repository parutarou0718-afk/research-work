import { useEffect, useState } from "react"
import { MessageSquare } from "lucide-react"
import { PandaWikiAskPanel } from "./panda-wiki-ask-panel"
import {
  loadPandaWikiChatConfig,
  type PandaWikiChatConfig,
} from "@/services/providers/pandawiki/chat/PandaWikiChatConfig"

/**
 * The remote chat surface deliberately remains separate from ChatPanel. The
 * latter owns local conversations, agent tools, and filesystem-backed state;
 * a PandaWiki virtual project has none of those capabilities.
 */
export function PandaWikiRemoteChat() {
  const [config, setConfig] = useState<PandaWikiChatConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void loadPandaWikiChatConfig()
      .then((nextConfig) => {
        if (active) setConfig(nextConfig)
      })
      .catch(() => {
        if (active) setError("Unable to load PandaWiki chat settings.")
      })
    return () => { active = false }
  }, [])

  if (error) {
    return <div role="alert" className="flex h-full items-center justify-center p-8 text-sm text-destructive">{error}</div>
  }

  if (!config) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading PandaWiki chat…</div>
  }

  return (
    <div className="flex h-full min-h-0 bg-background">
      <section className="flex min-w-0 flex-1 flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Ask this PandaWiki knowledge base</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Questions are sent through PandaWiki using its separate chat API token and current server-side permissions.
        </p>
      </section>
      <PandaWikiAskPanel config={config} />
    </div>
  )
}
