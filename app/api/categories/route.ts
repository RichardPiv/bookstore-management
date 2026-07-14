import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  createCategory,
  listCategories,
} from "@/services/categories/categories-service";

/** GET /api/categories — list all categories */
export async function GET() {
  try {
    const categories = await listCategories();
    return jsonData(categories);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/categories — create a category */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const category = await createCategory(body);
    return jsonData(category, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
