import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  createDeliveryStatus,
  listDeliveryStatuses,
} from "@/services/delivery_statuses/delivery_statuses-service";

/** GET /api/delivery-statuses — list all delivery statuses */
export async function GET() {
  try {
    const deliveryStatuses = await listDeliveryStatuses();
    return jsonData(deliveryStatuses);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/delivery-statuses — create a delivery status */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const deliveryStatus = await createDeliveryStatus(body);
    return jsonData(deliveryStatus, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
