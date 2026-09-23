export type ProjectDashboardFilter = "all" | "design" | "quoted" | "engineering";
export type ProjectDashboardLayout = "grid" | "list";

export function projectMatchesFilter(card: { statusTone: string }, filter: ProjectDashboardFilter) {
  if (filter === "all") return true;
  if (filter === "design") return card.statusTone === "design";
  if (filter === "quoted") return card.statusTone === "quoted";
  return card.statusTone === "approved" || card.statusTone === "sent";
}

export function filterProjectCards<T extends { name: string; kindLabel: string; statusLabel: string; statusTone: string; clientName?: string }>(
  cards: readonly T[],
  query: string,
  filter: ProjectDashboardFilter,
) {
  const needle = query.trim().toLowerCase();
  return cards.filter((card) => {
    const matchesQuery = !needle || `${card.name} ${card.kindLabel} ${card.statusLabel} ${card.clientName ?? ""}`.toLowerCase().includes(needle);
    return matchesQuery && projectMatchesFilter(card, filter);
  });
}

export function projectFilterCount<T extends { statusTone: string }>(
  cards: readonly T[],
  filter: ProjectDashboardFilter,
) {
  return cards.filter((card) => projectMatchesFilter(card, filter)).length;
}
