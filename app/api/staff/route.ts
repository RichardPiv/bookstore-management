import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { listEmployees } from "@/services/staff/staff-service";

/** GET /api/staff */
export async function GET() {
  try {
    const session = await requirePlayer();
    const employees = await listEmployees(session.id);
    return jsonData(employees);
  } catch (error) {
    return handleRouteError(error);
  }
}
