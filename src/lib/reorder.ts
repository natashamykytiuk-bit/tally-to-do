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
