import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { getClock, patchClock } from "@/services/clock/clock-service";

/** GET /api/simulation/clock */
export async function GET() {
  try {
    const session = await requirePlayer();
    const clock = await getClock(session.id);
    return jsonData(clock);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/simulation/clock — pause / speed */
export async function PATCH(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    const clock = await patchClock(session.id, body);
    return jsonData(clock);
  } catch (error) {
    return handleRouteError(error);
  }
}
