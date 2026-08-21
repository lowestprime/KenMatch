import type { SearchResultItem } from "./types";

export function filterSearchItems(items: SearchResultItem[], query: string) {
  const trimmed = query.trim().toLowerCase().slice(0, 120);
  if (!trimmed) return [];
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  function score(item: SearchResultItem) {
    const haystack = `${item.title} ${item.subtitle ?? ""} ${item.type}`.toLowerCase();
    let scoreValue = 0;
    for (const token of tokens) {
      if (!haystack.includes(token)) return -1;
      scoreValue += haystack.startsWith(token) ? 3 : 1;
    }
    if (item.type === "ken") scoreValue += 0.5;
    return scoreValue;
  }
  return items
    .map((item) => ({ item, score: score(item) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title))
    .slice(0, 25)
    .map((entry) => entry.item);
}

export async function searchSite(query: string, viewerProfileId: string | null) {
  const { searchIndex } = await import("./db");
  return filterSearchItems(await searchIndex(viewerProfileId), query);
}
