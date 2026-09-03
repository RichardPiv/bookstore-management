import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parseActiveQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { isPlayerRole } from "@/lib/roles";
import { createBook, listBooks } from "@/services/books/books-service";

/** GET /api/books — list books (optional ?active=true|false) */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const active = parseActiveQueryParam(
      new URL(request.url).searchParams.get("active"),
    );
    const books = await listBooks({
      active,
      user_id: isPlayerRole(session.role) ? session.id : undefined,
    });
    return jsonData(books);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/books — create a book */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const book = await createBook(body);
    return jsonData(book, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
