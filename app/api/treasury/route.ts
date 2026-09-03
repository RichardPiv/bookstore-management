import { parsePositiveIntQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { AppError, handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin, requireAuth, requirePlayer } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { getTreasuryOverview } from "@/services/treasury/treasury-service";

/** GET /api/treasury — player own treasury, or admin with ?user_id= */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const userIdParam = parsePositiveIntQueryParam(
      new URL(request.url).searchParams.get("user_id"),
      "user_id",
    );

    if (userIdParam !== undefined) {
      if (!isAdminRole(session.role)) {
        throw new AppError("FORBIDDEN", "Admin access required.", 403);
      }
      await requireAdmin();
      const overview = await getTreasuryOverview(userIdParam);
      return jsonData(overview);
    }

    const player = await requirePlayer();
    const overview = await getTreasuryOverview(player.id);
    return jsonData(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
