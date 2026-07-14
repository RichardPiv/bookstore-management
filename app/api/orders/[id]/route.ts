import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { getOrderById } from "@/services/orders/orders-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/orders/:id — get a supplier order */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const order = await getOrderById(id);

    if (!order) {
      return jsonError("NOT_FOUND", "Order not found.", 404);
    }

    return jsonData(order);
  } catch (error) {
    return handleRouteError(error);
  }
}
