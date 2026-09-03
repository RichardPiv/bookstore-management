import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { listStocks } from "@/services/stocks/stocks-service";

/** GET /api/stocks — list stock levels for the authenticated player */
export async function GET() {
  try {
    const session = await requirePlayer();
    const stocks = await listStocks(session.id);
    return jsonData(stocks);
  } catch (error) {
    return handleRouteError(error);
  }
}
