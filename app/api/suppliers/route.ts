import { jsonData } from "@/lib/api/responses";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import {
  createSupplier,
  listSuppliers,
} from "@/services/suppliers/suppliers-service";

/** GET /api/suppliers — list all suppliers */
export async function GET() {
  try {
    const suppliers = await listSuppliers();
    return jsonData(suppliers);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/suppliers — create a supplier */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const supplier = await createSupplier(body);
    return jsonData(supplier, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
