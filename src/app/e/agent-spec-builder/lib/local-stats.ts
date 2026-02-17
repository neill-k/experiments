/**
 * Lightweight local-only usage stats.
 * All data stays in localStorage - no network calls, no cookies, no tracking pixels.
 */

const STORAGE_KEY = "agent-spec-builder-stats";

export interface LocalStats {
  copies: number;
  downloads: number;
  exports: number;
  shares: number;
  promptPacks: number;
  presetLoads: number;
  sessions: number;
  firstSeen: string; // ISO date
  lastSeen: string;  // ISO date
}

const defaults: LocalStats = {
  copies: 0,
  downloads: 0,
  exports: 0,
  shares: 0,
  promptPacks: 0,
  presetLoads: 0,
  sessions: 0,
  firstSeen: new Date().toISOString(),
  lastSeen: new Date().toISOString(),
};

export function getStats(): LocalStats {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

function saveStats(stats: LocalStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // storage full or unavailable - silently ignore
  }
}

export function trackEvent(event: keyof Pick<LocalStats, "copies" | "downloads" | "exports" | "shares" | "promptPacks" | "presetLoads">): LocalStats {
  const stats = getStats();
  stats[event] += 1;
  stats.lastSeen = new Date().toISOString();
  saveStats(stats);
  return stats;
}

export function trackSession(): LocalStats {
  const stats = getStats();
  stats.sessions += 1;
  stats.lastSeen = new Date().toISOString();
  if (!stats.firstSeen) {
    stats.firstSeen = new Date().toISOString();
  }
  saveStats(stats);
  return stats;
}

export function formatStatsSummary(stats: LocalStats): string {
  const parts: string[] = [];
  if (stats.copies > 0) parts.push(`${stats.copies} cop${stats.copies === 1 ? "y" : "ies"}`);
  if (stats.downloads > 0) parts.push(`${stats.downloads} download${stats.downloads === 1 ? "" : "s"}`);
  if (stats.exports > 0) parts.push(`${stats.exports} export${stats.exports === 1 ? "" : "s"}`);
  if (stats.shares > 0) parts.push(`${stats.shares} share${stats.shares === 1 ? "" : "s"}`);
  if (stats.promptPacks > 0) parts.push(`${stats.promptPacks} prompt pack${stats.promptPacks === 1 ? "" : "s"}`);
  if (parts.length === 0) return "";
  return parts.join(" · ");
}
