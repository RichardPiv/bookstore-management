import { prisma } from "@/lib/prisma";
import { AuthorPublic, authorPublicSelect } from "./types";
import {
  validateCreateAuthorInput,
  validateUpdateAuthorInput,
} from "./validation";

/** List all authors. */
export async function listAuthors(): Promise<AuthorPublic[]> {
  return prisma.authors.findMany({
    select: authorPublicSelect,
    orderBy: { name: "asc" },
  });
}

/** Get an author by id. */
export async function getAuthorById(id: number): Promise<AuthorPublic | null> {
  return prisma.authors.findUnique({
    where: { id },
    select: authorPublicSelect,
  });
}

/** Create an author. */
export async function createAuthor(body: unknown): Promise<AuthorPublic> {
  const input = validateCreateAuthorInput(body);
  return prisma.authors.create({
    data: { name: input.name },
    select: authorPublicSelect,
  });
}

/** Update an author. */
export async function updateAuthor(
  id: number,
  body: unknown,
): Promise<AuthorPublic> {
  const input = validateUpdateAuthorInput(body);

  const data: { name?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  return prisma.authors.update({
    where: { id },
    data,
    select: authorPublicSelect,
  });
}

/** Delete an author. */
export async function deleteAuthor(id: number): Promise<AuthorPublic> {
  return prisma.authors.delete({
    where: { id },
    select: authorPublicSelect,
  });
}
