import { prisma } from "@/lib/prisma";

import { type FormatPublic, formatsPublicSelect } from "./types";
import {
  validateCreateFormatInput,
  validateUpdateFormatInput,
} from "./validation";

export async function listFormats(): Promise<FormatPublic[]> {
  return prisma.formats.findMany({
    select: formatsPublicSelect,
    orderBy: { name: "asc" },
  });
}

export async function getFormatById(id: number): Promise<FormatPublic | null> {
  return prisma.formats.findUnique({
    where: { id },
    select: formatsPublicSelect,
  });
}

export async function createFormat(body: unknown): Promise<FormatPublic> {
  const input = validateCreateFormatInput(body);
  return prisma.formats.create({
    data: { name: input.name, code: input.code },
    select: formatsPublicSelect,
  });
}

export async function updateFormat(
  id: number,
  body: unknown,
): Promise<FormatPublic> {
  const input = validateUpdateFormatInput(body);
  const data: { name?: string; code?: string } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.code !== undefined) data.code = input.code;

  return prisma.formats.update({
    where: { id },
    data,
    select: formatsPublicSelect,
  });
}

export async function deleteFormat(id: number): Promise<FormatPublic> {
  return prisma.formats.delete({
    where: { id },
    select: formatsPublicSelect,
  });
}
