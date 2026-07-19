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
import { Label } from "@/components/ui/label"
import { saveIdeaMarkdown } from "@/lib/idea-capture"
import { suggestIdeaRelatedKnowledge } from "@/lib/idea-related-suggestions"
import { refreshProjectFileTree } from "@/lib/project-file-tree-refresh"
import { useWikiStore } from "@/stores/wiki-store"
import {
  buildRelatedKnowledgeOptions,
  type RelatedKnowledgeOption,
} from "./related-knowledge-options"

interface NewIdeaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRelated?: RelatedKnowledgeOption[]
}

function parseTags(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function NewIdeaDialog({ open, onOpenChange, initialRelated = [] }: NewIdeaDialogProps) {
  const { t } = useTranslation()
  const project = useWikiStore((s) => s.project)
  const projectPathIndex = useWikiStore((s) => s.projectPathIndex)
  const openFileInPreview = useWikiStore((s) => s.openFileInPreview)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [relatedSearch, setRelatedSearch] = useState("")
  const [selectedRelated, setSelectedRelated] = useState<RelatedKnowledgeOption[]>([])
  const [suggestedRelated, setSuggestedRelated] = useState<RelatedKnowledgeOption[]>([])
  const [suggestingRelated, setSuggestingRelated] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedRelated(initialRelated)
      return
    }
    if (!open) {
      setTitle("")
      setContent("")
      setTags("")
      setRelatedSearch("")
      setSelectedRelated([])
      setSuggestedRelated([])
      setSuggestingRelated(false)
      setSaving(false)
      setError(null)
    }
  }, [open])

  const relatedOptions = useMemo(
    () => (project ? buildRelatedKnowledgeOptions(project.path, projectPathIndex) : []),
    [project, projectPathIndex],
  )

  const filteredRelatedOptions = useMemo(() => {
    const query = relatedSearch.trim().toLowerCase()
    const selectedTargets = new Set(selectedRelated.map((item) => item.target))
    return relatedOptions
      .filter((option) => !selectedTargets.has(option.target))
      .filter((option) => {
        if (!query) return true
        return (
          option.title.toLowerCase().includes(query) ||
          option.target.toLowerCase().includes(query)
        )
      })
      .slice(0, 8)
  }, [relatedOptions, relatedSearch, selectedRelated])

  const canSave = useMemo(
    () => Boolean(project && title.trim() && content.trim() && !saving),
    [content, project, saving, title],
  )

  function addRelated(option: RelatedKnowledgeOption) {
    setSelectedRelated((current) => (
      current.some((item) => item.target === option.target)
        ? current
        : [...current, option]
    ))
    setSuggestedRelated((current) => current.filter((item) => item.target !== option.target))
    setRelatedSearch("")
  }

  function removeRelated(target: string) {
    setSelectedRelated((current) => current.filter((item) => item.target !== target))
  }

  async function suggestRelated() {
    if (!project || suggestingRelated || (!title.trim() && !content.trim())) return
    setSuggestingRelated(true)
    setError(null)
    try {
      const suggestions = await suggestIdeaRelatedKnowledge({
        projectPath: project.path,
        title,
        content,
        options: relatedOptions,
        selectedTargets: new Set(selectedRelated.map((item) => item.target)),
        limit: 10,
      })
      setSuggestedRelated(suggestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.generic"))
    } finally {
      setSuggestingRelated(false)
    }
  }

  async function handleSave() {
    if (!project || !canSave) return
    setSaving(true)
    setError(null)
    try {
      const saved = await saveIdeaMarkdown(project.path, {
        title,
        content,
        tags: parseTags(tags),
        related: selectedRelated.map((item) => ({
          target: item.target,
          title: item.title,
        })),
      })
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("ideas.dialog.title")}</DialogTitle>
          <DialogDescription>{t("ideas.dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-idea-title">{t("ideas.fields.title")}</Label>
            <Input
              id="new-idea-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("ideas.placeholders.title")}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-idea-content">{t("ideas.fields.content")}</Label>
            <textarea
              id="new-idea-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("ideas.placeholders.content")}
              className="min-h-40 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-idea-tags">{t("ideas.fields.tags")}</Label>
            <Input
              id="new-idea-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder={t("ideas.placeholders.tags")}
            />
            <p className="text-xs text-muted-foreground">{t("ideas.dialog.tagsHint")}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="new-idea-related">{t("ideas.fields.relatedKnowledge")}</Label>
            <Input
              id="new-idea-related"
              value={relatedSearch}
              onChange={(event) => setRelatedSearch(event.target.value)}
              placeholder={t("ideas.placeholders.searchKnowledge")}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{t("ideas.dialog.relatedHint")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void suggestRelated()}
                disabled={suggestingRelated || (!title.trim() && !content.trim())}
              >
                {suggestingRelated ? t("ideas.actions.suggestingRelated") : t("ideas.actions.suggestRelated")}
              </Button>
            </div>

            {suggestedRelated.length > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                <div className="mb-2 text-xs font-medium text-foreground">
                  {t("ideas.dialog.suggestedRelatedTitle")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedRelated.map((option) => (
                    <Button
                      key={option.target}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRelated(option)}
                    >
                      {option.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedRelated.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedRelated.map((item) => (
                  <Button
                    key={item.target}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRelated(item.target)}
                    title={t("ideas.actions.removeRelated")}
                  >
                    {item.title} ×
                  </Button>
                ))}
              </div>
            )}

            <div className="max-h-32 overflow-auto rounded-lg border bg-background">
              {filteredRelatedOptions.length > 0 ? (
                filteredRelatedOptions.map((option) => (
                  <button
                    key={option.target}
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => addRelated(option)}
                  >
                    <span className="font-medium">{option.title}</span>
                    <span className="text-xs text-muted-foreground">{option.target}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {t("ideas.dialog.noRelatedMatches")}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{t("ideas.dialog.nextVersionTitle")}</div>
            <p className="mt-1">{t("ideas.dialog.nextVersionDescription")}</p>
          </div>

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
            {saving ? t("ideas.actions.saving") : t("ideas.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
