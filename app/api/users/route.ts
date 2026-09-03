import { parseJsonBody } from "@/lib/api/parse-json-body";
import { handleRouteError } from "@/lib/api/route-errors";
import { jsonData } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth";
import {
  createUser,
  listUsers,
} from "@/services/users/users-service";

/** GET /api/users — liste des utilisateurs */
export async function GET() {
  try {
    await requireAdmin();
    const users = await listUsers();
    return jsonData(users);
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST /api/users — création d'un utilisateur */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await parseJsonBody(request);
    const user = await createUser(body);
    return jsonData(user, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
