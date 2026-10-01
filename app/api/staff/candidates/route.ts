import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { getClock } from "@/services/clock/clock-service";
import { listCandidates } from "@/services/staff/staff-service";

/** GET /api/staff/candidates */
export async function GET() {
  try {
    const session = await requirePlayer();
    const clock = await getClock(session.id);
    const candidates = listCandidates(session.id, clock.sim_day);
    return jsonData(candidates);
  } catch (error) {
    return handleRouteError(error);
  }
}
