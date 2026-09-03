import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin } from "@/lib/auth";
import { listSupervisionPlayers } from "@/services/admin/supervision-service";

/** GET /api/admin/supervision — admin overview of all players */
export async function GET() {
  try {
    await requireAdmin();
    const players = await listSupervisionPlayers();
    return jsonData(players);
  } catch (error) {
    return handleRouteError(error);
  }
}
