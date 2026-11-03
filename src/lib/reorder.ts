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

/** Drop zones with a horizontal extent too (e.g. day columns); `left`/`right` default to the whole width. */
export type Zone2D = Zone & { left?: number; right?: number };

/** The zone under a pointer at (x, y), or null. Zones without left/right match any x. */
export function zoneAtPoint(zones: Zone2D[], x: number, y: number): string | null {
  const hit = zones.find(
    (z) => y >= z.top && y <= z.bottom && (z.left === undefined || (x >= z.left && x <= (z.right ?? Infinity))),
  );
  return hit?.key ?? null;
}

/** Where a card dropped at window y lands among cards whose middles are at `mids` (top to bottom). */
export const slotAt = (mids: number[], y: number): number => mids.filter((m) => m < y).length;

/**
 * Puts `subset` (some of a day's rows, in their new order) into a saved `order` that may hold other rows too:
 * they take the slots the subset already had, the others stay put, and any new ones go after the last slot.
 */
export function mergeOrder(order: string[], subset: string[]): string[] {
  const inSubset = new Set(subset);
  const slots = order.flatMap((k, i) => (inSubset.has(k) ? [i] : []));
  const out = order.slice();
  slots.forEach((slot, n) => (out[slot] = subset[n]));
  const rest = subset.slice(slots.length);
  if (!slots.length) return [...out, ...rest];
  const last = slots[slots.length - 1];
  return [...out.slice(0, last + 1), ...rest, ...out.slice(last + 1)];
}
