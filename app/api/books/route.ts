import { parseJsonBody } from "@/lib/api/parse-json-body";
import { parseActiveQueryParam } from "@/lib/api/parse-query";
import { jsonData } from "@/lib/api/responses";
import { handleRouteError } from "@/lib/api/route-errors";
import { createBook, listBooks } from "@/services/books/books-service";

/** GET /api/books — list books (optional ?active=true|false) */
export async function GET(request: Request) {
  try {
    const active = parseActiveQueryParam(
      new URL(request.url).searchParams.get("active"),
    );
    const books = await listBooks({ active });
    return jsonData(books);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/books — create a book */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const book = await createBook(body);
    return jsonData(book, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
