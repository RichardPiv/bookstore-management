import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { listLocations } from "@/services/locations/locations-service";

/** GET /api/locations */
export async function GET() {
  try {
    await requirePlayer();
    const locations = await listLocations();
    return jsonData(locations);
  } catch (error) {
    return handleRouteError(error);
  }
}
