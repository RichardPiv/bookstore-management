import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { getSimulationWorld } from "@/services/simulation/live-service";

/** GET /api/simulation/world — clock, staff, tasks, catalog snapshot, locations */
export async function GET() {
  try {
    const session = await requirePlayer();
    const world = await getSimulationWorld(session.id);
    return jsonData(world);
  } catch (error) {
    return handleRouteError(error);
  }
}
