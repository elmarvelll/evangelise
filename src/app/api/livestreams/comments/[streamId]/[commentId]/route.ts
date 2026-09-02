import { deleteCommentController } from "./route.controller";

interface RouteParams {
  params: Promise<{ streamId: string; commentId: string }>;
}

export async function DELETE(request: Request, context: RouteParams) {
  return deleteCommentController(request, context);
}
