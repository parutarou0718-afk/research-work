import { parseFrontmatter } from "@/lib/frontmatter"
import { getFileStem, getRelativePath, normalizePath } from "@/lib/path-utils"

export interface PaperOption {
  path: string
  title: string
  isPaperTyped: boolean
}

export interface MarkdownFileCandidate {
  path: string
  content: string
}

const SOURCE_PAPER_EXTENSIONS = new Set([
  "md",
  "mdx",
  "txt",
  "pdf",
  "doc",
  "docx",
  "odt",
  "rtf",
  "epub",
  "pptx",
])

function extensionOf(path: string): string {
  const name = normalizePath(path).split("/").pop() ?? ""
  if (!name.includes(".")) return ""
  return name.split(".").pop()?.toLowerCase() ?? ""
}

function isRawSourcePath(path: string): boolean {
  return normalizePath(path).toLowerCase().includes("/raw/sources/")
}

function isSelectableSourceFile(path: string): boolean {
  const normalized = normalizePath(path)
  const name = normalized.split("/").pop() ?? ""
  if (!isRawSourcePath(normalized)) return false
  if (!name || name.startsWith(".") || name.startsWith("~$")) return false
  if (normalized.toLowerCase().includes("/raw/sources/.cache/")) return false
  return SOURCE_PAPER_EXTENSIONS.has(extensionOf(normalized))
}


function titleFromMarkdown(path: string, content: string): string {
  const parsed = parseFrontmatter(content)
  const fmTitle = parsed.frontmatter?.title
  if (typeof fmTitle === "string" && fmTitle.trim()) return fmTitle.trim()
  return getFileStem(path)
}

function isPaperMarkdown(content: string): boolean {
  const parsed = parseFrontmatter(content)
  return parsed.frontmatter?.type === "paper"
}

export function buildPaperOptionsFromFiles(
  projectPath: string,
  markdownPaths: string[],
  files: MarkdownFileCandidate[],
  sourcePaths: string[] = [],
): PaperOption[] {
  const markdownPathSet = new Set(markdownPaths.map(normalizePath))
  const candidates = files
    .filter((file) => markdownPathSet.has(normalizePath(file.path)))
    .map((file) => ({
      path: getRelativePath(normalizePath(file.path), normalizePath(projectPath)),
      title: titleFromMarkdown(file.path, file.content),
      isPaperTyped: isPaperMarkdown(file.content),
    }))
  const sourceCandidates = sourcePaths.filter(isSelectableSourceFile).map((path) => ({
    path: getRelativePath(normalizePath(path), normalizePath(projectPath)),
    title: getFileStem(path),
    isPaperTyped: false,
  }))

  const paperTyped = candidates.filter((option) => option.isPaperTyped)
  const markdownCandidates = paperTyped.length > 0 ? paperTyped : candidates
  const deduped = new Map<string, PaperOption>()
  for (const option of [...markdownCandidates, ...sourceCandidates]) {
    deduped.set(option.path, option)
  }
  return [...deduped.values()].sort((a, b) => a.title.localeCompare(b.title))
}
