/** A copy of `arr` with the element at `from` moved to `to`. */
export function moveIndex<T>(arr: T[], from: number, to: number): T[] {
  const out = arr.slice();
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}

/** Where a row dragged `dy` pixels from `start` lands, given each row takes `stride` pixels. */
export function dropIndex(start: number, dy: number, stride: number, count: number): number {
  return Math.max(0, Math.min(count - 1, start + Math.round(dy / stride)));
}

export type Zone = { key: string; top: number; bottom: number };

/** The drop zone under a pointer at window y, or the nearest one when between zones. */
export function zoneAt(zones: Zone[], y: number): string | null {
  if (!zones.length) return null;
  const hit = zones.find((z) => y >= z.top && y <= z.bottom);
  if (hit) return hit.key;
  let best = zones[0];
  const dist = (z: Zone) => (y < z.top ? z.top - y : y - z.bottom);
  for (const z of zones) if (dist(z) < dist(best)) best = z;
  return best.key;
}

export type SortMode = 'custom' | 'due' | 'created' | 'az';

export const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: 'custom', label: 'My order' },
  { value: 'due', label: 'Due date' },
  { value: 'created', label: 'Date created' },
  { value: 'az', label: 'A to Z' },
];

type Sortable = { key: string; title: string; due?: string; created?: number };

/**
 * Orders rows for display. `custom` follows `order` (row keys), with rows not in it after, in their
 * incoming order. `due`: soonest first, undated last. `created`: newest first. `az`: by title.
 * Ties keep their incoming order.
 */
export function sortRows<T extends Sortable>(rows: T[], mode: SortMode, order: string[] = []): T[] {
  const byIndex = new Map(rows.map((r, i) => [r.key, i]));
  const stable = (a: T, b: T) => byIndex.get(a.key)! - byIndex.get(b.key)!;
  const out = rows.slice();
  if (mode === 'custom') {
    const pos = new Map(order.map((k, i) => [k, i]));
    const at = (r: T) => pos.get(r.key) ?? Infinity;
    return out.sort((a, b) => (at(a) === at(b) ? stable(a, b) : at(a) - at(b)));
  }
  if (mode === 'due') return out.sort((a, b) => (a.due ?? '9').localeCompare(b.due ?? '9') || stable(a, b));
  if (mode === 'created') return out.sort((a, b) => (b.created ?? -1) - (a.created ?? -1) || stable(a, b));
  return out.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }) || stable(a, b));
}
