import { LogOut, Server } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProviderSettingsProps {
  providerName: string
  providerType: string
  serverUrl: string
  connected: boolean
  account?: string
  onLogout?(): Promise<void>
}

/** Enterprise deployments display connection information but do not edit it here. */
export function ProviderSettings({ providerName, providerType, serverUrl, connected, account, onLogout }: ProviderSettingsProps) {
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
    </section>
  )
}
