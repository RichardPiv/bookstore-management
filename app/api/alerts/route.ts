import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { createAlert, listAlerts } from "@/services/alerts/alerts-service";

/** GET /api/alerts — list alerts for the authenticated player */
export async function GET(request: Request) {
  try {
    const session = await requirePlayer();
    const params = new URL(request.url).searchParams;
    const alerts = await listAlerts({
      user_id: session.id,
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

/** POST /api/alerts — create an alert for the authenticated player */
export async function POST(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    const alert = await createAlert(session.id, body);
    return jsonData(alert, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
