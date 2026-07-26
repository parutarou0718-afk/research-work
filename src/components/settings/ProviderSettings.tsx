import { useEffect, useState } from "react"
import { KeyRound, LogOut, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PandaWikiChatConfig } from "@/services/providers/pandawiki/chat/PandaWikiChatConfig"

interface ProviderSettingsProps {
  providerName: string
  providerType: string
  serverUrl: string
  connected: boolean
  account?: string
  onLogout?(): Promise<void>
  chatConfig: PandaWikiChatConfig
  chatTokenExists: boolean
  chatBusy?: boolean
  onSaveChatConfig(config: PandaWikiChatConfig): Promise<void>
  onSaveChatToken(endpointUrl: string, token: string): Promise<void>
  onClearChatToken(): Promise<void>
}

/** Enterprise deployments display connection information but do not edit it here. */
export function ProviderSettings({ providerName, providerType, serverUrl, connected, account, onLogout, chatConfig, chatTokenExists, chatBusy, onSaveChatConfig, onSaveChatToken, onClearChatToken }: ProviderSettingsProps) {
  const [endpointUrl, setEndpointUrl] = useState(chatConfig.endpointUrl)
  const [model, setModel] = useState(chatConfig.model)
  const [timeoutSeconds, setTimeoutSeconds] = useState(String(chatConfig.timeoutSeconds))
  const [token, setToken] = useState("")
  const [chatError, setChatError] = useState<string | null>(null)

  useEffect(() => {
    setEndpointUrl(chatConfig.endpointUrl)
    setModel(chatConfig.model)
    setTimeoutSeconds(String(chatConfig.timeoutSeconds))
  }, [chatConfig])

  const saveChatConfig = async () => {
    setChatError(null)
    try {
      await onSaveChatConfig({ endpointUrl, model, timeoutSeconds: Number(timeoutSeconds), providerName: "pandawiki" })
      if (token.trim()) {
        await onSaveChatToken(endpointUrl, token)
        setToken("")
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Unable to save PandaWiki chat settings.")
    }
  }

  return (
    <section className="w-full max-w-xl rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <Server className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="font-semibold">Knowledge provider</h2>
            <p className="mt-1 text-sm text-muted-foreground">{providerName} · {providerType}</p>
          </div>
        </div>
        <span className={connected ? "text-sm text-emerald-600" : "text-sm text-muted-foreground"}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Server</dt><dd className="truncate text-right">{serverUrl}</dd></div>
        {account && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Signed in as</dt><dd>{account}</dd></div>}
      </dl>
      {onLogout && (
        <Button className="mt-4" variant="outline" size="sm" onClick={() => { void onLogout() }}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
        </Button>
      )}
      <div className="mt-5 border-t pt-4">
        <div className="flex items-center gap-2"><KeyRound className="h-4 w-4" /><h3 className="text-sm font-medium">PandaWiki chat</h3></div>
        <p className="mt-1 text-xs text-muted-foreground">The chat token is stored only in Windows Credential Manager.</p>
        <label className="mt-3 block text-xs font-medium" htmlFor="pandawiki-chat-endpoint">Complete endpoint URL</label>
        <Input id="pandawiki-chat-endpoint" className="mt-1" value={endpointUrl} onChange={(event) => setEndpointUrl(event.target.value)} placeholder="https://server/share/v1/chat/completions" disabled={chatBusy} />
        <label className="mt-3 block text-xs font-medium" htmlFor="pandawiki-chat-model">Model</label>
        <Input id="pandawiki-chat-model" className="mt-1" value={model} onChange={(event) => setModel(event.target.value)} disabled={chatBusy} />
        <label className="mt-3 block text-xs font-medium" htmlFor="pandawiki-chat-timeout">Timeout (seconds)</label>
        <Input id="pandawiki-chat-timeout" className="mt-1" type="number" min="5" max="120" value={timeoutSeconds} onChange={(event) => setTimeoutSeconds(event.target.value)} disabled={chatBusy} />
        <label className="mt-3 block text-xs font-medium" htmlFor="pandawiki-chat-token">Chat API token</label>
        <Input id="pandawiki-chat-token" className="mt-1" type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder={chatTokenExists ? "Token is saved; enter a value to replace it" : "Paste the PandaWiki chat API token"} disabled={chatBusy} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { void saveChatConfig() }} disabled={chatBusy}>Save chat settings</Button>
          <Button size="sm" variant="outline" onClick={() => { void onClearChatToken() }} disabled={chatBusy || !chatTokenExists}>Clear chat token</Button>
        </div>
        {chatTokenExists && <p className="mt-2 text-xs text-emerald-600">A chat token is stored for this endpoint.</p>}
        {chatError && <p role="alert" className="mt-2 text-xs text-destructive">{chatError}</p>}
      </div>
    </section>
  )
}
