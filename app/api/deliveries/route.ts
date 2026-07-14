import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { listDeliveries } from "@/services/deliveries/deliveries-service";

/** GET /api/deliveries — list deliveries */
export async function GET() {
  try {
    const deliveries = await listDeliveries();
    return jsonData(deliveries);
  } catch (error) {
    return handleRouteError(error);
  }
}
