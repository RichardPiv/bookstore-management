import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { getDashboardOverview } from "@/services/dashboard/dashboard-service";

/** GET /api/dashboard — overview indicators for the player bookstore */
export async function GET() {
  try {
    const session = await requirePlayer();
    const overview = await getDashboardOverview(session.id);
    return jsonData(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
