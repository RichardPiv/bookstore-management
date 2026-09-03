import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import { jsonData } from "@/lib/api/responses";
import { requireAdmin, requireAuth } from "@/lib/auth";
import {
  createFormat,
  listFormats,
} from "@/services/formats/formats-service";

export async function GET() {
  try {
    await requireAuth();
    const formats = await listFormats();
    return jsonData(formats);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const format = await createFormat(body);
    return jsonData(format, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
