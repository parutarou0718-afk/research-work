import { useEffect, useState } from "react"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_PANDAWIKI_CHAT_CONFIG,
  loadPandaWikiChatConfig,
  savePandaWikiChatConfig,
  type PandaWikiChatConfig,
} from "@/services/providers/pandawiki/chat/PandaWikiChatConfig"
import { createTauriPandaWikiChatCredentialStore } from "@/services/providers/pandawiki/chat/PandaWikiChatCredentialStore"

/**
 * This section owns only non-secret endpoint/model settings. The API token is
 * submitted directly to an existing Rust command and is never read back into
 * TypeScript after it has been saved.
 */
export function PandaWikiChatSection() {
  const [config, setConfig] = useState<PandaWikiChatConfig | null>(null)
  const [token, setToken] = useState("")
  const [tokenConfigured, setTokenConfigured] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    const credentials = createTauriPandaWikiChatCredentialStore()
    void loadPandaWikiChatConfig()
      .then(async (nextConfig) => {
        const hasToken = nextConfig.endpointUrl
          ? await credentials.hasToken(nextConfig.endpointUrl)
          : false
        if (!active) return
        setConfig(nextConfig)
        setTokenConfigured(hasToken)
      })
      .catch(() => {
        if (active) setError("Unable to load PandaWiki chat settings.")
      })
    return () => { active = false }
  }, [])

  const update = (patch: Partial<PandaWikiChatConfig>) => {
    setConfig((current) => current ? { ...current, ...patch } : current)
    setSaved(false)
  }

  const save = async () => {
    if (!config || busy) return
    const endpointUrl = config.endpointUrl.trim()
    if (!endpointUrl) {
      setError("Enter the complete PandaWiki chat endpoint URL.")
      return
    }

    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const nextConfig = await savePandaWikiChatConfig({ ...config, endpointUrl })
      if (token.trim()) {
        await createTauriPandaWikiChatCredentialStore().saveToken(nextConfig.endpointUrl, token)
        // A successful command is sufficient: avoid treating an immediate,
        // separate credential read as the only proof that save succeeded.
        setTokenConfigured(true)
        setToken("")
      }
      setConfig(nextConfig)
      setSaved(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save PandaWiki chat settings.")
    } finally {
      setBusy(false)
    }
  }

  const clearToken = async () => {
    if (!config?.endpointUrl || busy) return
    setBusy(true)
    setError(null)
    try {
      await createTauriPandaWikiChatCredentialStore().clearToken(config.endpointUrl)
      setTokenConfigured(false)
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Unable to clear the PandaWiki chat token.")
    } finally {
      setBusy(false)
    }
  }

  if (error && !config) {
    return <p role="alert" className="text-sm text-destructive">{error}</p>
  }
  if (!config) {
    return <p className="text-sm text-muted-foreground">Loading PandaWiki chat settings…</p>
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2"><KeyRound className="h-4 w-4" /><h2 className="text-base font-semibold">PandaWiki chat</h2></div>
        <p className="mt-1 text-sm text-muted-foreground">Use the separate PandaWiki chat API token. It is stored only in Windows Credential Manager.</p>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="pandawiki-chat-endpoint">Complete endpoint URL</label>
        <Input id="pandawiki-chat-endpoint" className="mt-1" value={config.endpointUrl} onChange={(event) => update({ endpointUrl: event.target.value })} placeholder="https://server/share/v1/chat/completions" disabled={busy} />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="pandawiki-chat-model">Model</label>
        <Input id="pandawiki-chat-model" className="mt-1" value={config.model} onChange={(event) => update({ model: event.target.value })} disabled={busy} />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="pandawiki-chat-timeout">Timeout (seconds)</label>
        <Input id="pandawiki-chat-timeout" className="mt-1" type="number" min="5" max="120" value={config.timeoutSeconds} onChange={(event) => update({ timeoutSeconds: Number(event.target.value) || DEFAULT_PANDAWIKI_CHAT_CONFIG.timeoutSeconds })} disabled={busy} />
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="pandawiki-chat-token">Chat API token</label>
        <Input id="pandawiki-chat-token" className="mt-1" type="password" value={token} onChange={(event) => { setToken(event.target.value); setSaved(false) }} placeholder={tokenConfigured ? "A token is saved; enter a value to replace it" : "Paste the PandaWiki chat API token"} disabled={busy} />
        {tokenConfigured && <p className="mt-1 text-xs text-emerald-600">A chat token is configured for this endpoint.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => { void save() }} disabled={busy}>Save PandaWiki chat settings</Button>
        <Button type="button" variant="outline" onClick={() => { void clearToken() }} disabled={busy || !tokenConfigured}>Clear chat token</Button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
