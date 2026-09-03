import { jsonData } from "@/lib/api/responses";
import { AppError, handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin, requireAuth, requirePlayer } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { listMovements } from "@/services/treasury/treasury-service";
import { parsePositiveIntQueryParam } from "@/lib/api/parse-query";

/** GET /api/treasury/movements — player journal, or admin with ?user_id= */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const params = new URL(request.url).searchParams;
    const userIdParam = parsePositiveIntQueryParam(
      params.get("user_id"),
      "user_id",
    );

    let userId: number;
    if (userIdParam !== undefined) {
      if (!isAdminRole(session.role)) {
        throw new AppError("FORBIDDEN", "Admin access required.", 403);
      }
      await requireAdmin();
      userId = userIdParam;
    } else {
      const player = await requirePlayer();
      userId = player.id;
    }

    const movements = await listMovements(userId, params);
    return jsonData(movements);
  } catch (error) {
    return handleRouteError(error);
  }
}
