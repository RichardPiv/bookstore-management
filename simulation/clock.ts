import { CATCH_UP_CAP_MINUTES } from "./types";
import type { TickCommit, TickResult } from "./types";

export type SimClock = TickResult["clock"];

/**
 * Catch-up après gel d’onglet (P0.5 / L5).
 * `tickStep` = un pas moteur déjà câblé (ex. engine.tick).
 */
export function runCatchUp(
  simMinutesWanted: number,
  paused: boolean,
  tickStep: (dtMs: number) => TickResult,
  currentClock: () => SimClock,
): { result: TickResult; banner: string | null } {
  const capped = Math.min(
    CATCH_UP_CAP_MINUTES,
    Math.max(0, simMinutesWanted),
  );
  const commits: TickCommit[] = [];
  let closedDay = false;
  if (capped < 0.05 || paused) {
    return {
      result: {
        commits,
        closed_day: false,
        clock: currentClock(),
      },
      banner: null,
    };
  }

  let left = capped;
  let lastClock = currentClock();
  while (left > 0.001) {
    const step = Math.min(0.25, left);
    const result = tickStep(step * 1000);
    commits.push(...result.commits);
    if (result.closed_day) closedDay = true;
    lastClock = result.clock;
    left -= step;
  }
  const mins = Math.round(capped);
  const banner =
    mins <= 1
      ? "Rattrapage : environ 1 min simulée."
      : `Rattrapage : ${mins} min simulées (plafond ${CATCH_UP_CAP_MINUTES}).`;
  return {
    result: {
      commits,
      closed_day: closedDay,
      clock: lastClock,
    },
    banner,
  };
}
