import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  createAlertType,
  listAlertTypes,
} from "@/services/alert_types/alert_types-service";

/** GET /api/alert-types — list all alert types */
export async function GET() {
  try {
    const alertTypes = await listAlertTypes();
    return jsonData(alertTypes);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/alert-types — create an alert type */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const alertType = await createAlertType(body);
    return jsonData(alertType, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
