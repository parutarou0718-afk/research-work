import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildQuickIdeaCaptureInput } from "@/lib/quick-idea-capture"
import { saveIdeaMarkdown } from "@/lib/idea-capture"
import { refreshProjectFileTree } from "@/lib/project-file-tree-refresh"
import { useWikiStore } from "@/stores/wiki-store"

interface QuickCaptureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickCaptureDialog({ open, onOpenChange }: QuickCaptureDialogProps) {
  const { t } = useTranslation()
  const project = useWikiStore((s) => s.project)
  const openFileInPreview = useWikiStore((s) => s.openFileInPreview)
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setText("")
      setSaving(false)
      setError(null)
    }
  }, [open])

  const canSave = useMemo(
    () => Boolean(project && text.trim() && !saving),
    [project, saving, text],
  )

  async function handleSave() {
    if (!project || !canSave) return
    setSaving(true)
    setError(null)
    try {
      const saved = await saveIdeaMarkdown(project.path, buildQuickIdeaCaptureInput(text))
      await refreshProjectFileTree(project.path, {
        projectId: project.id,
        bumpDataVersion: true,
      })
      openFileInPreview(saved.path, saved.markdown)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.generic"))
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("ideas.quick.title")}</DialogTitle>
          <DialogDescription>{t("ideas.quick.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                void handleSave()
              }
            }}
            placeholder={t("ideas.quick.placeholder")}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">{t("ideas.quick.hint")}</p>
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={!canSave}>
            {saving ? t("ideas.actions.saving") : t("ideas.quick.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
