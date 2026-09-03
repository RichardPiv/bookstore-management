import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { createAuthor, listAuthors } from "@/services/authors/authors-service";

/** GET /api/authors — list all authors */
export async function GET() {
  try {
    await requireAuth();
    const authors = await listAuthors();
    return jsonData(authors);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/authors — create an author */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const author = await createAuthor(body);
    return jsonData(author, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
