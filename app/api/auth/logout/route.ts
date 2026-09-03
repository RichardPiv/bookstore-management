import { cookies } from "next/headers";

import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  clearedCookieOptions,
  clearedRoleCookieOptions,
  SESSION_COOKIE_NAME,
  SESSION_ROLE_COOKIE_NAME,
} from "@/lib/session";
import { logout } from "@/services/auth/auth-service";

/** POST /api/auth/logout — invalidate session and clear cookies */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await logout(token);
    }

    const response = jsonData({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", clearedCookieOptions());
    response.cookies.set(SESSION_ROLE_COOKIE_NAME, "", clearedRoleCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
