import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin } from "@/lib/auth";
import { getTreasuryOverview } from "@/services/treasury/treasury-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/admin/users/:id/treasury — admin view of a player's treasury */
export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const overview = await getTreasuryOverview(id);
    return jsonData(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
