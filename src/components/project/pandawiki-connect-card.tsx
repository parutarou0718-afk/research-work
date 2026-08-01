import { Cloud, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PandaWikiConnectCardProps {
  connected: boolean
  onConnect(): void
}

/**
 * The server option is deliberately separate from local project actions. A
 * local workspace can always be opened even when no PandaWiki server exists.
 */
export function PandaWikiConnectCard({ connected, onConnect }: PandaWikiConnectCardProps) {
  return (
    <section className="w-full max-w-md" aria-label="服务器 Wiki">
      <div className="rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Cloud className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium">服务器 Wiki</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {connected ? "已连接，可选择您有权限访问的知识库。" : "连接 PandaWiki 或企业知识库服务器。"}
            </p>
          </div>
          <Button type="button" variant={connected ? "outline" : "default"} size="sm" onClick={onConnect}>
            <LogIn className="mr-1.5 h-3.5 w-3.5" />
            {connected ? "管理连接" : "连接服务器"}
          </Button>
        </div>
      </div>
    </section>
  )
}
