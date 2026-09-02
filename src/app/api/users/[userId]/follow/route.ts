import { followController, unfollowController } from "./route.controller";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function POST(request: Request, context: RouteParams) {
  return followController(request, context);
}

export async function DELETE(request: Request, context: RouteParams) {
  return unfollowController(request, context);
}
