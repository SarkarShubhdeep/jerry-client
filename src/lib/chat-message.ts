/**
 * If the user sends a single line "# Title more body…", split into a markdown
 * heading plus body so the model and renderer treat "# Title" as the topic.
 */
export function normalizeUserMessageContent(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('# ')) {
    return trimmed
  }

  if (trimmed.includes('\n')) {
    return trimmed
  }

  const match = trimmed.match(/^#\s+(\S(?:.*?\S)?)\s+(.+)$/)
  if (match) {
    return `# ${match[1]}\n\n${match[2]}`
  }

  return trimmed
}
