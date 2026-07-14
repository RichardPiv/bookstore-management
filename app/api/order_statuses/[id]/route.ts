import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteOrderStatus,
  getOrderStatusById,
  updateOrderStatus,
} from "@/services/order_statuses/order_statuses-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/order-statuses/:id — get an order status by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const orderStatus = await getOrderStatusById(id);

    if (!orderStatus) {
      return jsonError("NOT_FOUND", "Alert type not found.", 404);
    }

    return jsonData(orderStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/order-statuses/:id — update an order status */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const orderStatus = await updateOrderStatus(id, body);

    return jsonData(orderStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/order-statuses/:id — delete an order status */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const orderStatus = await deleteOrderStatus(id);
    return jsonData(orderStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}
