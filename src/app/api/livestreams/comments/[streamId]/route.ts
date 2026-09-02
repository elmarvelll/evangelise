import { createCommentController, listCommentsController } from "./route.controller";

interface RouteParams {
  params: Promise<{
    streamId: string;
  }>;
}

export async function GET(request: Request, context: RouteParams) {
  return listCommentsController(request, context);
}

export async function POST(request: Request, context: RouteParams) {
  return createCommentController(request, context);
}
