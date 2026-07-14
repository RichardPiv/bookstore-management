import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteAlertStatus,
  getAlertStatusById,
  updateAlertStatus,
} from "@/services/alert_statuses/alert_statuses-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/alert-statuses/:id — get an alert status by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const alertStatus = await getAlertStatusById(id);

    if (!alertStatus) {
      return jsonError("NOT_FOUND", "Alert status not found.", 404);
    }

    return jsonData(alertStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/alert-statuses/:id — update an alert status */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const alertStatus = await updateAlertStatus(id, body);

    return jsonData(alertStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/alert-statuses/:id — delete an alert status */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);
    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const alertStatus = await deleteAlertStatus(id);
    return jsonData(alertStatus);
  } catch (error) {
    return handleRouteError(error);
  }
}
