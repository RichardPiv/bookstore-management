import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { adjustTreasury } from "@/services/treasury/treasury-service";

/** POST /api/treasury/adjust — injection / retrait manuel (D66). */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const result = await adjustTreasury(body);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
