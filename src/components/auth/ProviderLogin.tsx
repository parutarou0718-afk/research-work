import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LoginInput } from "@/types/wiki"

interface ProviderLoginProps {
  defaultServerUrl: string
  onLogin(credentials: LoginInput): Promise<void>
  connectionError?: string | null
}

export function validateProviderLoginInput(input: LoginInput): string | null {
  if (!input.serverUrl.trim()) return "Server address is required"
  try {
    const url = new URL(input.serverUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Server address must be an http or https URL"
    }
  } catch {
    return "Server address must be an http or https URL"
  }
  if (!input.account.trim()) return "Account is required"
  if (!input.password) return "Password is required"
  return null
}

export function ProviderLogin({ defaultServerUrl, onLogin, connectionError = null }: ProviderLoginProps) {
  const [serverUrl, setServerUrl] = useState(defaultServerUrl)
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(connectionError)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = { serverUrl: serverUrl.trim(), account: account.trim(), password }
    const validationError = validateProviderLoginInput(input)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onLogin(input)
    } catch {
      setError("Unable to sign in. Check the server address and credentials, then try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex h-full items-center justify-center bg-background px-4">
      <form className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6 shadow-sm" onSubmit={handleSubmit}>
        <div>
          <h1 className="text-xl font-semibold">Connect to PandaWiki</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access your authorized knowledge bases.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pandawiki-server">Server address</Label>
          <Input id="pandawiki-server" value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} autoComplete="url" disabled={submitting} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pandawiki-account">Account</Label>
          <Input id="pandawiki-account" value={account} onChange={(event) => setAccount(event.target.value)} autoComplete="username" disabled={submitting} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pandawiki-password">Password</Label>
          <Input id="pandawiki-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" disabled={submitting} />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </main>
  )
}
