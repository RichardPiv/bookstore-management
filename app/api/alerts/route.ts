import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { createAlert, listAlerts } from "@/services/alerts/alerts-service";

/** GET /api/alerts — list alerts */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const alerts = await listAlerts({
      book_id: parsePositiveIntQueryParam(params.get("book_id"), "book_id"),
      alert_status_id: parsePositiveIntQueryParam(
        params.get("alert_status_id"),
        "alert_status_id",
      ),
    });
    return jsonData(alerts);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/alerts — create an alert */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const alert = await createAlert(body);
    return jsonData(alert, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
