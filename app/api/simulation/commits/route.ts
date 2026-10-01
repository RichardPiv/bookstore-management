import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { applyLiveCommits } from "@/services/simulation/live-service";

/** POST /api/simulation/commits — apply live engine business facts */
export async function POST(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    const result = await applyLiveCommits(session.id, body);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
