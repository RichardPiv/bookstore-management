import { parseJsonBody } from "@/lib/api/parse-json-body";
import { jsonData } from "@/lib/api/responses";
import { AppError, handleRouteError } from "@/lib/api/route-errors";
import { requirePlayer } from "@/lib/auth";
import { changeOwnPassword, getUserById } from "@/services/users/users-service";

/** GET /api/profile — player self profile */
export async function GET() {
  try {
    const session = await requirePlayer();
    const user = await getUserById(session.id);
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }
    return jsonData(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/profile — change own password */
export async function PATCH(request: Request) {
  try {
    const session = await requirePlayer();
    const body = await parseJsonBody(request);

    if (!body || typeof body !== "object") {
      throw new AppError("VALIDATION_ERROR", "Invalid request body.", 400);
    }

    const { current_password, new_password } = body as Record<string, unknown>;

    if (typeof current_password !== "string" || current_password.length === 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "current_password" is required.',
        400,
      );
    }

    if (typeof new_password !== "string" || new_password.length === 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        'The field "new_password" is required.',
        400,
      );
    }

    await changeOwnPassword(session.id, current_password, new_password);
    return jsonData({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
