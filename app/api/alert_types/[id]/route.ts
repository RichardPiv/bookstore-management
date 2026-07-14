import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteAlertType,
  getAlertTypeById,
  updateAlertType,
} from "@/services/alert_types/alert_types-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/alert-types/:id — get an alert type by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const alertType = await getAlertTypeById(id);

    if (!alertType) {
      return jsonError("NOT_FOUND", "Alert type not found.", 404);
    }

    return jsonData(alertType);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/alert-types/:id — update an alert type */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const alertType = await updateAlertType(id, body);

    return jsonData(alertType);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/alert-types/:id — delete an alert type */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const alertType = await deleteAlertType(id);
    return jsonData(alertType);
  } catch (error) {
    return handleRouteError(error);
  }
}
