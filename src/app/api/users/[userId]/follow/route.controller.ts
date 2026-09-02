import { badRequest, conflict, json, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { followUser, unfollowUser } from "@/services/follow.service";
import { ConflictError, ValidationError } from "@/services/errors";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * POST /api/users/[userId]/follow
 * Follows the streamer at `userId`. The follower's identity always
 * comes from the session — never trust a client-supplied follower id.
 */
export async function followController(request: Request, { params }: RouteParams) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { userId: followingId } = await params;

  try {
    await followUser(session.user.id, followingId);
    return json({ success: true }, 201);
  } catch (error) {
    if (error instanceof ValidationError) {
      return badRequest(error.message);
    }

    if (error instanceof ConflictError) {
      return conflict(error.message);
    }

    throw error;
  }
}

/**
 * DELETE /api/users/[userId]/follow
 * Unfollows the streamer at `userId`. Idempotent — unfollowing someone
 * you don't follow succeeds without error.
 */
export async function unfollowController(request: Request, { params }: RouteParams) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { userId: followingId } = await params;

  await unfollowUser(session.user.id, followingId);

  return json({ success: true });
}
