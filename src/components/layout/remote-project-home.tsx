import { BookOpen } from "lucide-react"
import type { PandaWikiVirtualProject } from "@/domain/projects"

export function RemoteProjectHome({ project }: { project: PandaWikiVirtualProject }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-lg rounded-xl border bg-card p-8 text-center">
        <BookOpen className="mx-auto h-9 w-9 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">{project.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a PandaWiki knowledge base. Remote document browsing will appear here as the
          knowledge-tree adapter is connected.
        </p>
      </div>
    </div>
  )
}
