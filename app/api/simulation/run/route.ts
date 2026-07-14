import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { runSimulation } from "@/services/simulation/simulation-service";

/** POST /api/simulation/run — run a simulation batch */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const result = await runSimulation(body);
    return jsonData(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
