import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { snapshotOnly } from "@/services/simulation/live-service";
import { AppError } from "@/lib/api/route-errors";

/** POST /api/simulation/snapshot — persist clock + engine snapshot */
export async function POST(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    if (!body || typeof body !== "object") {
      throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
    }
    const raw = body as {
      clock?: {
        sim_day: number;
        sim_minutes: number;
        speed: number;
        paused: boolean;
      };
      snapshot?: unknown;
    };
    if (!raw.clock || raw.snapshot === undefined) {
      throw new AppError("VALIDATION_ERROR", "clock and snapshot are required.", 400);
    }
    const clock = await snapshotOnly(session.id, {
      clock: raw.clock,
      snapshot: raw.snapshot,
    });
    return jsonData(clock);
  } catch (error) {
    return handleRouteError(error);
  }
}
