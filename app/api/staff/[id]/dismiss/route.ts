import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { dismissEmployee } from "@/services/staff/staff-service";

type RouteContext = { params: Promise<{ id: string }> };

/** POST /api/staff/:id/dismiss */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requirePlayer();
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);
    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }
    const employee = await dismissEmployee(session.id, id);
    return jsonData(employee);
  } catch (error) {
    return handleRouteError(error);
  }
}
