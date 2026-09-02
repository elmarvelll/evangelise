import { streamerStatsController } from "./route.controller";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: Request, context: RouteParams) {
  return streamerStatsController(request, context);
}
