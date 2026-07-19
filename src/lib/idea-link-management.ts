import { buildRelatedWikilink, type IdeaRelatedKnowledge } from "@/lib/idea-capture"

const WIKILINK_RE = /\[\[([^\]|]+?)(?:\|([^\]]*?))?\]\]/g

function cleanTarget(value: string): string {
  return value
    .replace(/\[\[|\]\]/g, "")
    .replace(/\\/g, "/")
    .replace(/[\r\n|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function splitLines(markdown: string): { lines: string[]; hadTrailingNewline: boolean } {
  return {
    lines: markdown.replace(/\r\n?/g, "\n").split("\n"),
    hadTrailingNewline: /\n$/.test(markdown),
  }
}

function joinLines(lines: string[], forceTrailingNewline: boolean): string {
  const joined = lines.join("\n")
  return forceTrailingNewline && !joined.endsWith("\n") ? `${joined}\n` : joined
}

export function markdownHasRelatedLink(markdown: string, target: string): boolean {
  const normalizedTarget = cleanTarget(target)
  if (!normalizedTarget) return false

  const regex = new RegExp(WIKILINK_RE.source, "g")
  let match: RegExpExecArray | null
  while ((match = regex.exec(markdown)) !== null) {
    if (cleanTarget(match[1]) === normalizedTarget) return true
  }
  return false
}

export function addRelatedLinkToMarkdown(markdown: string, related: IdeaRelatedKnowledge): string {
  const link = buildRelatedWikilink(related)
  if (!link || markdownHasRelatedLink(markdown, related.target)) return markdown

  const { lines } = splitLines(markdown)
  const relatedIndex = lines.findIndex((line) => /^##\s+Related\s*$/i.test(line.trim()))

  if (relatedIndex === -1) {
    const trimmed = markdown.replace(/\s+$/g, "")
    return `${trimmed}\n\n## Related\n\n${link}\n`
  }

  let insertAt = relatedIndex + 1
  while (insertAt < lines.length && lines[insertAt].trim() === "") insertAt += 1
  while (insertAt < lines.length && lines[insertAt].trim() !== "" && !/^#{1,6}\s+/.test(lines[insertAt].trim())) {
    insertAt += 1
  }

  lines.splice(insertAt, 0, link)
  return joinLines(lines, true)
}

export function removeRelatedLinkFromMarkdown(markdown: string, target: string): string {
  const normalizedTarget = cleanTarget(target)
  if (!normalizedTarget) return markdown

  const { lines, hadTrailingNewline } = splitLines(markdown)
  let changed = false
  const nextLines = lines.filter((line) => {
    const trimmed = line.trim()
    if (!trimmed) return true
    const onlyLink = trimmed.match(/^\[\[([^\]|]+?)(?:\|([^\]]*?))?\]\]$/)
    if (!onlyLink) return true
    if (cleanTarget(onlyLink[1]) !== normalizedTarget) return true
    changed = true
    return false
  })

  return changed ? joinLines(nextLines, hadTrailingNewline) : markdown
}
