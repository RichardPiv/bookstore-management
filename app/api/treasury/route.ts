import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { getTreasuryOverview } from "@/services/treasury/treasury-service";

/** GET /api/treasury — solde, seuil et is_low (D67). */
export async function GET() {
  try {
    const overview = await getTreasuryOverview();
    return jsonData(overview);
  } catch (error) {
    return handleRouteError(error);
  }
}
