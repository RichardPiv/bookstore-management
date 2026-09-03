import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { runSimulation } from "@/services/simulation/simulation-service";

/** POST /api/simulation/run — run a simulation batch for the player */
export async function POST(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    const result = await runSimulation(session.id, body);
    return jsonData(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
