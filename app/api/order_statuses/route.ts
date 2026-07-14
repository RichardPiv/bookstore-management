import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  createOrderStatus,
  listOrderStatuses,
} from "@/services/order_statuses/order_statuses-service";

/** GET /api/order-statuses — list all order statuses */
export async function GET() {
  try {
    const orderStatuses = await listOrderStatuses();
    return jsonData(orderStatuses);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/order-statuses — create an order status */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const orderStatus = await createOrderStatus(body);
    return jsonData(orderStatus, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
