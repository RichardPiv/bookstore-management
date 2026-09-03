import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requireAuth } from "@/lib/auth";

/** GET /api/auth/me — resolve current authenticated user from session cookie */
export async function GET() {
  try {
    const user = await requireAuth();
    return jsonData(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
