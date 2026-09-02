import { activityStreamController } from "./route.controller";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteParams) {
  return activityStreamController(request, context);
}
