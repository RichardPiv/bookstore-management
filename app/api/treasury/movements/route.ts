import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { listMovements } from "@/services/treasury/treasury-service";

/** GET /api/treasury/movements — journal (`?type=` / `?limit=`). */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const movements = await listMovements(params);
    return jsonData(movements);
  } catch (error) {
    return handleRouteError(error);
  }
}
