import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { AppError, handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin } from "@/lib/auth";
import { adjustTreasury } from "@/services/treasury/treasury-service";

/** POST /api/treasury/adjust — admin injection / retrait for a player (D66). */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);

    if (!body || typeof body !== "object") {
      throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
    }

    const { user_id: rawUserId, ...adjustBody } = body as Record<
      string,
      unknown
    >;

    if (
      typeof rawUserId !== "number" ||
      !Number.isInteger(rawUserId) ||
      rawUserId <= 0
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "user_id" must be a positive integer.',
        400,
      );
    }

    const result = await adjustTreasury(rawUserId, adjustBody);
    return jsonData(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
