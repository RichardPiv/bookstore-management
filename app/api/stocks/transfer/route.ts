import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { transferToShelf } from "@/services/stocks/stocks-service";

/** POST /api/stocks/transfer — transfer reserve stock to shelf */
export async function POST(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);
    const stock = await transferToShelf(session.id, body);
    return jsonData(stock);
  } catch (error) {
    return handleRouteError(error);
  }
}
