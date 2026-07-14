import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/services/categories/categories-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/categories/:id — get a category by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const category = await getCategoryById(id);

    if (!category) {
      return jsonError("NOT_FOUND", "Category not found.", 404);
    }

    return jsonData(category);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/categories/:id — update a category */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const category = await updateCategory(id, body);

    return jsonData(category);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/categories/:id — delete a category */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const category = await deleteCategory(id);
    return jsonData(category);
  } catch (error) {
    return handleRouteError(error);
  }
}
