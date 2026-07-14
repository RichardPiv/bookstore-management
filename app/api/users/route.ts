import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import { jsonData, jsonError } from "@/lib/api/responses";
import {
  createUser,
  listUsers,
} from "@/services/users/users-service";

/** GET /api/users — liste des administrateurs */
export async function GET() {
  try {
    const users = await listUsers();
    return jsonData(users);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/users — création d'un administrateur */
export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request);
    const user = await createUser(body);
    return jsonData(user, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
