import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { createOrder, listOrders } from "@/services/orders/orders-service";

/** GET /api/orders — list supplier orders for the authenticated player */
export async function GET(request: Request) {
  try {
    const session = await requirePlayer();
    const params = new URL(request.url).searchParams;
    const orders = await listOrders({
      user_id: session.id,
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

/** POST /api/orders — create a supplier order (session user; body user_id ignored) */
export async function POST(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    const order = await createOrder(session.id, body);
    return jsonData(order, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
