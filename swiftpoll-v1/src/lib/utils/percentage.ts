/**
 * Compute the percentage share of `count` against `total`, rounded to one
 * decimal place. Returns 0 when there are no votes yet (avoids divide-by-zero).
 */
export function computePercentage(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}
