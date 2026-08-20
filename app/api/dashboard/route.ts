import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { getDashboardOverview } from "@/services/dashboard/dashboard-service";

/** GET /api/dashboard — overview indicators for the admin home. */
export async function GET() {
  try {
    const overview = await getDashboardOverview();
    return jsonData(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
