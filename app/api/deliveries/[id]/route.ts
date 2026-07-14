import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { getDeliveryById } from "@/services/deliveries/deliveries-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/deliveries/:id — get a delivery */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const delivery = await getDeliveryById(id);

    if (!delivery) {
      return jsonError("NOT_FOUND", "Delivery not found.", 404);
    }

    return jsonData(delivery);
  } catch (error) {
    return handleRouteError(error);
  }
}
