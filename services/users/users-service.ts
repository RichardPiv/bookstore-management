import { AppError } from "@/lib/api/route-errors";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_TREASURY_BALANCE,
  INITIAL_TREASURY_LOW_THRESHOLD,
  isPlayerRole,
  isUserRole,
  type UserRole,
} from "@/lib/roles";
import { ensureTreasuryAccount } from "@/services/treasury/treasury-service";

import { userPublicSelect, type UserPublic } from "./types";
import { validateCreateUserInput, validateUpdateUserInput } from "./validation";

/** List all users (without password). */
export async function listUsers(): Promise<UserPublic[]> {
  return prisma.users.findMany({
    select: userPublicSelect,
    orderBy: { username: "asc" },
  });
}

/** Get a user by id, or `null` if it doesn't exist. */
export async function getUserById(id: number): Promise<UserPublic | null> {
  return prisma.users.findUnique({
    where: { id },
    select: userPublicSelect,
  });
}

/** Get a user with password hash by username (auth only — never expose in API). */
export async function getUserWithPasswordByUsername(username: string) {
  return prisma.users.findFirst({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      password: true,
      role: true,
    },
  });
}

/** Create a user with hashed password; players get a treasury account. */
export async function createUser(body: unknown): Promise<UserPublic> {
  const input = validateCreateUserInput(body);
  const hashedPassword = await hashPassword(input.password);
  const role: UserRole = input.role ?? "user";

  return prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        username: input.username,
        email: input.email,
        password: hashedPassword,
        role,
      },
      select: userPublicSelect,
    });

    if (isPlayerRole(role)) {
      await ensureTreasuryAccount(
        user.id,
        {
          balance: INITIAL_TREASURY_BALANCE,
          low_threshold: INITIAL_TREASURY_LOW_THRESHOLD,
        },
        tx,
      );
    }

    return user;
  });
}

/** Update a user. */
export async function updateUser(
  id: number,
  body: unknown,
): Promise<UserPublic> {
  const input = validateUpdateUserInput(body);

  const data: {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
  } = {};

  if (input.username !== undefined) {
    data.username = input.username;
  }

  if (input.email !== undefined) {
    data.email = input.email;
  }

  if (input.password !== undefined) {
    data.password = await hashPassword(input.password);
  }

  if (input.role !== undefined) {
    if (!isUserRole(input.role)) {
      throw new Error("Invalid role");
    }
    data.role = input.role;
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.users.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!current) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }

    const user = await tx.users.update({
      where: { id },
      data,
      select: userPublicSelect,
    });

    const nextRole = user.role;
    if (isPlayerRole(nextRole)) {
      await ensureTreasuryAccount(user.id, {}, tx);
    }

    return user;
  });
}

/** Delete a user and their player data. */
export async function deleteUser(id: number): Promise<UserPublic> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { id },
      select: userPublicSelect,
    });

    if (!user) {
      throw new AppError("NOT_FOUND", "User not found.", 404);
    }

    const runs = await tx.simulation_runs.findMany({
      where: { user_id: id },
      select: { id: true },
    });
    if (runs.length > 0) {
      await tx.simulation_events.deleteMany({
        where: { simulation_run_id: { in: runs.map((run) => run.id) } },
      });
      await tx.simulation_runs.deleteMany({ where: { user_id: id } });
    }

    await tx.treasury_movements.deleteMany({ where: { user_id: id } });
    await tx.treasury_account.deleteMany({ where: { user_id: id } });
    await tx.alerts.deleteMany({ where: { user_id: id } });
    await tx.book_inventory.deleteMany({ where: { user_id: id } });
    await tx.sessions.deleteMany({ where: { user_id: id } });

    // Orders keep history; FK is soft (no DB constraint). Leave orders as-is.
    await tx.users.delete({ where: { id } });

    return user;
  });
}

/** Change password for the authenticated user (current password required). */
export async function changeOwnPassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { verifyPassword } = await import("@/lib/password");

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new AppError("NOT_FOUND", "User not found.", 404);
  }

  const ok = await verifyPassword(currentPassword, user.password);
  if (!ok) {
    throw new AppError("INVALID_CREDENTIALS", "Current password is invalid.", 401);
  }

  if (newPassword.length < 8) {
    throw new AppError(
      "VALIDATION_ERROR",
      "The password must contain at least 8 characters.",
      400,
    );
  }

  await prisma.users.update({
    where: { id: userId },
    data: { password: await hashPassword(newPassword) },
  });
}
