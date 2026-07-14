import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parsePositiveIntId } from "@/lib/api/parse-id";
import { jsonData, jsonError } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  deleteBook,
  getBookById,
  updateBook,
} from "@/services/books/books-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** GET /api/books/:id — get a book by id */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const book = await getBookById(id);

    if (!book) {
      return jsonError("NOT_FOUND", "Book not found.", 404);
    }

    return jsonData(book);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** PATCH /api/books/:id — update a book */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const body = await parseJsonBody(request);
    const book = await updateBook(id, body);

    return jsonData(book);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** DELETE /api/books/:id — delete a book */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: rawId } = await context.params;
    const id = parsePositiveIntId(rawId);

    if (id === null) {
      return jsonError("INVALID_ID", "Invalid identifier.", 400);
    }

    const book = await deleteBook(id);
    return jsonData(book);
  } catch (error) {
    return handleRouteError(error);
  }
}
