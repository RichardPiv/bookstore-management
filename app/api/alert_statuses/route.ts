import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  createAlertStatus,
  listAlertStatuses,
} from "@/services/alert_statuses/alert_statuses-service";

/** GET /api/alert-statuses — list all alert statuses */
export async function GET() {
  try {
    await requireAuth();
    const alertStatuses = await listAlertStatuses();
    return jsonData(alertStatuses);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/alert-statuses — create an alert status */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const alertStatus = await createAlertStatus(body);
    return jsonData(alertStatus, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
