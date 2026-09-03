import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requireAuth } from "@/lib/auth";
import { listDeliveries } from "@/services/deliveries/deliveries-service";

/** GET /api/deliveries — list deliveries */
export async function GET() {
  try {
    await requireAuth();
    const deliveries = await listDeliveries();
    return jsonData(deliveries);
  } catch (error) {
    return handleRouteError(error);
  }
}
