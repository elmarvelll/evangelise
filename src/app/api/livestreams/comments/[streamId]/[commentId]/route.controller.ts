import { json, notFound, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { deleteComment } from "@/services/comment.service";
import { NotFoundError, UnauthorizedError } from "@/services/errors";

interface RouteParams {
  params: Promise<{ streamId: string; commentId: string }>;
}

/**
 * DELETE /api/livestreams/comments/[streamId]/[commentId]
 * Basic moderation: the comment's author or the livestream's owner can
 * remove it (soft delete). `streamId` isn't used for authorization
 * directly — ownership is derived from the comment/livestream rows in
 * `comment.service`, not the URL.
 */
export async function deleteCommentController(request: Request, { params }: RouteParams) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { commentId } = await params;

  try {
    await deleteComment(commentId, session.user.id);
    return json({ success: true });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFound(error.message);
    }

    if (error instanceof UnauthorizedError) {
      return unauthorized(error.message);
    }

    throw error;
  }
}
