import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { listStocks } from "@/services/stocks/stocks-service";

/** GET /api/stocks — list stock levels */
export async function GET() {
  try {
    const stocks = await listStocks();
    return jsonData(stocks);
  } catch (error) {
    return handleRouteError(error);
  }
}
