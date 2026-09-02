import { followStatusController } from "./route.controller";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, context: RouteParams) {
  return followStatusController(request, context);
}
