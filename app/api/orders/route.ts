import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { createOrder, listOrders } from "@/services/orders/orders-service";

/** GET /api/orders — list supplier orders */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const orders = await listOrders({
      order_status_id: parsePositiveIntQueryParam(
        params.get("order_status_id"),
        "order_status_id",
      ),
    });
    return jsonData(orders);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/orders — create a supplier order */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const order = await createOrder(body);
    return jsonData(order, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
