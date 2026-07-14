import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

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

/** Create a user with hashed password. */
export async function createUser(body: unknown): Promise<UserPublic> {
  const input = validateCreateUserInput(body);
  const hashedPassword = await hashPassword(input.password);

  return prisma.users.create({
    data: {
      username: input.username,
      email: input.email,
      password: hashedPassword,
    },
    select: userPublicSelect,
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

  return prisma.users.update({
    where: { id },
    data,
    select: userPublicSelect,
  });
}

/** Delete a user (physical DELETE). */
export async function deleteUser(id: number): Promise<UserPublic> {
  return prisma.users.delete({
    where: { id },
    select: userPublicSelect,
  });
}
