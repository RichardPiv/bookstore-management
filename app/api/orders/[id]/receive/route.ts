import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { receiveOrder } from "@/services/orders/orders-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** POST /api/orders/:id/receive — receive a pending supplier order */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const order = await receiveOrder(id);
    return jsonData(order);
  } catch (error) {
    return handleRouteError(error);
  }
}
