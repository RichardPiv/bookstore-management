import { prisma } from "@/lib/prisma";
import { type CategoryPublic, categoriesPublicSelect } from "./types";
import {
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
} from "./validation";

/** List all categories. */
export async function listCategories(): Promise<CategoryPublic[]> {
  return prisma.categories.findMany({
    select: categoriesPublicSelect,
    orderBy: { name: "asc" },
  });
}

/** Get a category by id. */
export async function getCategoryById(
  id: number,
): Promise<CategoryPublic | null> {
  return prisma.categories.findUnique({
    where: { id },
    select: categoriesPublicSelect,
  });
}

/** Create a category. */
export async function createCategory(body: unknown): Promise<CategoryPublic> {
  const input = validateCreateCategoryInput(body);
  return prisma.categories.create({
    data: { name: input.name },
    select: categoriesPublicSelect,
  });
}

/** Update a category. */
export async function updateCategory(
  id: number,
  body: unknown,
): Promise<CategoryPublic> {
  const input = validateUpdateCategoryInput(body);

  const data: { name?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  return prisma.categories.update({
    where: { id },
    data,
    select: categoriesPublicSelect,
  });
}

/** Delete a category. */
export async function deleteCategory(id: number): Promise<CategoryPublic> {
  return prisma.categories.delete({
    where: { id },
    select: categoriesPublicSelect,
  });
}
