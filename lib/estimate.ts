/**
 * Estimated payout for a set of lines.
 *
 * Runs on both sides: the browser for the live sticky bar, the server action
 * for the number actually persisted. The server passes prices it read from the
 * database, so a tampered client can never inflate what gets stored.
 */
export type EstimateLine = { qty: number; price_min: number; price_max: number };

export function estimate(lines: EstimateLine[]): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const l of lines) {
    const q = Number(l.qty) || 0;
    min += q * Number(l.price_min);
    max += q * Number(l.price_max);
  }
  return { min: Math.round(min), max: Math.round(max) };
}
