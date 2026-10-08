/**
 * Encode / decode ETA de livraison en minutes simulées dans `deliveries.delivery_datetime`
 * (sans migration : epoch fictif 2000-01-01 UTC).
 * totalMinutes = sim_day * 1440 + sim_minutes (+ délai à l’encodage).
 */

const SIM_ETA_EPOCH_MS = Date.UTC(2000, 0, 1);
const MINUTES_PER_DAY = 24 * 60;

/** Délai commande → quai : 40–90 minutes simulées. */
export const DELIVERY_DELAY_MIN = 40;
export const DELIVERY_DELAY_MAX = 90;

export function encodeSimEta(simDay: number, simMinutes: number): Date {
  const total = Math.max(0, Math.floor(simDay) * MINUTES_PER_DAY + Math.floor(simMinutes));
  return new Date(SIM_ETA_EPOCH_MS + total * 60_000);
}

export function decodeSimEta(date: Date): { sim_day: number; sim_minutes: number; total: number } {
  const total = Math.max(
    0,
    Math.floor((date.getTime() - SIM_ETA_EPOCH_MS) / 60_000),
  );
  const sim_day = Math.max(1, Math.floor(total / MINUTES_PER_DAY));
  const sim_minutes = total % MINUTES_PER_DAY;
  return { sim_day, sim_minutes, total };
}

export function simTotal(simDay: number, simMinutes: number): number {
  return Math.floor(simDay) * MINUTES_PER_DAY + Math.floor(simMinutes);
}

export function hasSimEtaArrived(
  eta: Date,
  simDay: number,
  simMinutes: number,
): boolean {
  return simTotal(simDay, simMinutes) >= decodeSimEta(eta).total;
}

export function rollDeliveryDelayMinutes(seed = Math.random()): number {
  return (
    DELIVERY_DELAY_MIN +
    Math.floor(seed * (DELIVERY_DELAY_MAX - DELIVERY_DELAY_MIN + 1))
  );
}

export function formatSimEtaLabel(simDay: number, simMinutes: number): string {
  const h = Math.floor(simMinutes / 60);
  const m = Math.floor(simMinutes % 60);
  return `J${simDay} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
