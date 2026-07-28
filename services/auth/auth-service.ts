import { AppError } from "@/lib/api/route-errors";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  SESSION_DURATION_MS,
} from "@/lib/session";
import {
  getUserWithPasswordByUsername,
} from "@/services/users/users-service";
import { userPublicSelect } from "@/services/users/types";

import type { LoginResult } from "./types";
import { validateLoginInput } from "./validation";

/** Authenticate a user and create a DB session (D49, D50). */
export async function login(body: unknown): Promise<LoginResult> {
  const input = validateLoginInput(body);

  const user = await getUserWithPasswordByUsername(input.username);
  if (!user) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Invalid username or password.",
      401,
    );
  }

  const passwordValid = await verifyPassword(input.password, user.password);
  if (!passwordValid) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Invalid username or password.",
      401,
    );
  }

  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.sessions.create({
    data: {
      token,
      user_id: user.id,
      expires_at: expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    token,
    expires_at: expiresAt,
  };
}

/** Resolve a valid session token to the public user, or null. */
export async function getUserBySessionToken(
  token: string,
): Promise<{ id: number; username: string; email: string } | null> {
  const session = await prisma.sessions.findUnique({
    where: { token },
    select: {
      expires_at: true,
      user_id: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expires_at.getTime() <= Date.now()) {
    await prisma.sessions.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  return prisma.users.findUnique({
    where: { id: session.user_id },
    select: userPublicSelect,
  });
}
