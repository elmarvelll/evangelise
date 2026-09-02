import { badRequest, json, notFound, serverError, tooManyRequests, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { createComment, listCommentsForStream } from "@/services/comment.service";
import { NotFoundError, RateLimitError, ValidationError } from "@/services/errors";

interface RouteParams {
  params: Promise<{
    streamId: string;
  }>;
}

/**
 * GET /api/livestreams/comments/[streamId]
 * Public: anyone viewing a stream can read its comments.
 */
export async function listCommentsController(request: Request, { params }: RouteParams) {
  try {
    const { streamId: livestreamId } = await params;
    const comments = await listCommentsForStream(livestreamId);

    return json(comments, 200);
  } catch (error) {
    console.error("Fetch comments error:", error);
    return serverError("Failed to fetch comments");
  }
}

/**
 * POST /api/livestreams/comments/[streamId]
 * Requires a signed-in user.
 */
export async function createCommentController(request: Request, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();

    if (!session?.user) {
      return unauthorized();
    }

    const { streamId: livestreamId } = await params;
    const body = await request.json();

    const comment = await createComment(livestreamId, session.user.id, body.text);

    return json(comment, 201);
  } catch (error) {
    if (error instanceof ValidationError) {
      return badRequest(error.message);
    }

    if (error instanceof NotFoundError) {
      return notFound(error.message);
    }

    if (error instanceof RateLimitError) {
      return tooManyRequests(error.message);
    }

    console.error("Create comment error:", error);
    return serverError("Failed to create comment");
  }
}
