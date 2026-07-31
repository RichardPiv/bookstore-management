import { cookies } from "next/headers";

import { jsonData } from "@/lib/api/responses";
import { AppError, handleRouteError } from "@/lib/api/route-errors";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { getUserBySessionToken } from "@/services/auth/auth-service";

/** GET /api/auth/me — resolve current authenticated user from session cookie */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
    }

    const user = await getUserBySessionToken(token);

    if (!user) {
      throw new AppError("UNAUTHENTICATED", "Authentication required.", 401);
    }

    return jsonData(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
