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
