import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteDeliveryStatus,
  getDeliveryStatusById,
  updateDeliveryStatus,
} from "@/services/delivery_statuses/delivery_statuses-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/delivery-statuses/:id — get a delivery status by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const deliveryStatus = await getDeliveryStatusById(id);

    if (!deliveryStatus) {
      return jsonError("NOT_FOUND", "Alert type not found.", 404);
    }

    return jsonData(deliveryStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/delivery-statuses/:id — update a delivery status */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const deliveryStatus = await updateDeliveryStatus(id, body);

    return jsonData(deliveryStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/delivery-statuses/:id — delete a delivery status */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const deliveryStatus = await deleteDeliveryStatus(id);
    return jsonData(deliveryStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}
