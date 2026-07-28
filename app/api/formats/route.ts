import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import { jsonData } from "@/lib/api/responses";
import {
  createFormat,
  listFormats,
} from "@/services/formats/formats-service";

export async function GET() {
  try {
    const formats = await listFormats();
    return jsonData(formats);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const format = await createFormat(body);
    return jsonData(format, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
