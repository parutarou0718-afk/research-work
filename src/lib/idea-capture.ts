import { createDirectory, fileExists, writeFileAtomic } from "@/commands/fs"
import { getRelativePath, joinPath, normalizePath } from "@/lib/path-utils"

export interface IdeaCaptureInput {
  title: string
  content: string
  tags: string[]
  related?: IdeaRelatedKnowledge[]
  now?: Date
}

export interface SavedIdea {
  path: string
  relativePath: string
  markdown: string
}

export interface IdeaRelatedKnowledge {
  target: string
  title: string
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function normalizeTag(tag: string): string {
  return tag.trim()
}

function yamlScalar(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return "\"\""
  if (/^[-?]|[:#\[\]{}&,*!|>'"%@`]/.test(trimmed)) {
    return JSON.stringify(trimmed)
  }
  return trimmed
}

export function ideaSlugFromTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[\\/]+/g, "-")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "idea"
}

function wikilinkPart(value: string): string {
  return value
    .replace(/\[\[|\]\]/g, "")
    .replace(/[\r\n|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function buildRelatedWikilink(related: IdeaRelatedKnowledge): string | null {
  const target = wikilinkPart(related.target)
  const title = wikilinkPart(related.title)
  if (!target) return null
  if (!title || title === target) return `[[${target}]]`
  return `[[${target}|${title}]]`
}

export function buildIdeaMarkdown(input: IdeaCaptureInput): string {
  const now = input.now ?? new Date()
  const date = formatDate(now)
  const tags = [...new Set(input.tags.map(normalizeTag).filter(Boolean))]
  const relatedLinks = [...new Set(
    (input.related ?? [])
      .map(buildRelatedWikilink)
      .filter((link): link is string => Boolean(link)),
  )]
  const lines = [
    "---",
    "type: idea",
    `title: ${yamlScalar(input.title)}`,
    `created: ${date}`,
    `updated: ${date}`,
    "tags:",
    ...tags.map((tag) => `  - ${yamlScalar(tag)}`),
    "---",
    "",
    input.content.trim(),
    "",
  ]
  if (relatedLinks.length > 0) {
    lines.push(
      "## Related",
      "",
      ...relatedLinks,
      "",
    )
  }
  return lines.join("\n")
}

async function uniqueIdeaPath(projectPath: string, slug: string): Promise<string> {
  const ideasDir = joinPath(projectPath, "wiki", "ideas")
  let counter = 1
  while (true) {
    const suffix = counter === 1 ? "" : `-${counter}`
    const candidate = joinPath(ideasDir, `${slug}${suffix}.md`)
    if (!(await fileExists(candidate))) return candidate
    counter += 1
  }
}

export async function saveIdeaMarkdown(projectPath: string, input: IdeaCaptureInput): Promise<SavedIdea> {
  const normalizedProjectPath = normalizePath(projectPath).replace(/\/$/, "")
  const slug = ideaSlugFromTitle(input.title)
  const markdown = buildIdeaMarkdown(input)
  await createDirectory(joinPath(normalizedProjectPath, "wiki")).catch(() => {})
  await createDirectory(joinPath(normalizedProjectPath, "wiki", "ideas")).catch(() => {})
  const path = await uniqueIdeaPath(normalizedProjectPath, slug)
  await writeFileAtomic(path, markdown)
  return {
    path,
    relativePath: getRelativePath(path, normalizedProjectPath),
    markdown,
  }
}
