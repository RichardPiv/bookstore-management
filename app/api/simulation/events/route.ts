import { parsePositiveIntQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { listSimulationEvents } from "@/services/simulation/simulation-service";

/** GET /api/simulation/events — list simulation events for the player */
export async function GET(request: Request) {
  try {
    const session = await requirePlayer();
    const params = new URL(request.url).searchParams;
    const events = await listSimulationEvents(session.id, {
      simulation_run_id: parsePositiveIntQueryParam(
        params.get("simulation_run_id"),
        "simulation_run_id",
      ),
    });
    return jsonData(events);
  } catch (error) {
    return handleRouteError(error);
  }
}
