import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteAlert,
  getAlertById,
  updateAlert,
} from "@/services/alerts/alerts-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/alerts/:id — get an alert */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const alert = await getAlertById(id);

    if (!alert) {
      return jsonError("NOT_FOUND", "Alert not found.", 404);
    }

    return jsonData(alert);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/alerts/:id — update an alert */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const alert = await updateAlert(id, body);
    return jsonData(alert);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/alerts/:id — delete an alert */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const alert = await deleteAlert(id);
    return jsonData(alert);
  } catch (error) {
    return handleRouteError(error);
  }
}
