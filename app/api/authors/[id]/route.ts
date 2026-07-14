import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteAuthor,
  getAuthorById,
  updateAuthor,
} from "@/services/authors/authors-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/authors/:id — get an author by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const author = await getAuthorById(id);

    if (!author) {
      return jsonError("NOT_FOUND", "Author not found.", 404);
    }

    return jsonData(author);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/authors/:id — update an author */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const author = await updateAuthor(id, body);

    return jsonData(author);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/authors/:id — delete an author */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);
    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const author = await deleteAuthor(id);
    return jsonData(author);
  } catch (error) {
    return handleRouteError(error);
  }
}
