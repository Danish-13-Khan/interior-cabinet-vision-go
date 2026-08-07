export type SearchableCommand = {
  id: string;
  label: string;
  hint: string;
  shortcut: string;
  category?: string;
  keywords?: string[];
};

/** Lightweight fuzzy ranker for command palette search. */
export function scoreCommandMatch(
  command: SearchableCommand,
  query: string,
): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 1;

  const haystacks = [
    command.label,
    command.hint,
    command.shortcut,
    command.category ?? "",
    ...(command.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (haystacks.includes(needle)) {
    const label = command.label.toLowerCase();
    if (label.startsWith(needle)) return 100;
    if (label.includes(needle)) return 80;
    return 60;
  }

  let score = 0;
  let cursor = 0;
  for (const char of needle) {
    const index = haystacks.indexOf(char, cursor);
    if (index < 0) return 0;
    score += 2;
    if (index === cursor) score += 3;
    cursor = index + 1;
  }
  return score;
}

export function rankCommands<T extends SearchableCommand>(
  commands: T[],
  query: string,
  recentIds: string[] = [],
): T[] {
  const needle = query.trim();
  if (!needle) {
    const recentSet = new Set(recentIds);
    const recent = recentIds
      .map((id) => commands.find((item) => item.id === id))
      .filter((item): item is T => Boolean(item));
    const rest = commands.filter((item) => !recentSet.has(item.id));
    return [...recent, ...rest];
  }

  return commands
    .map((item) => ({ item, score: scoreCommandMatch(item, needle) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .map((entry) => entry.item);
}

export function upsertRecentCommandId(
  recentIds: string[],
  commandId: string,
  limit = 8,
): string[] {
  return [commandId, ...recentIds.filter((id) => id !== commandId)].slice(0, limit);
}
