import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import { createAuthor, listAuthors } from "@/services/authors/authors-service";

/** GET /api/authors — list all authors */
export async function GET() {
  try {
    const authors = await listAuthors();
    return jsonData(authors);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/authors — create an author */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const author = await createAuthor(body);
    return jsonData(author, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
