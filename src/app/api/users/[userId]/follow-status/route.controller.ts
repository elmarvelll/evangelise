import { json, serverError } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { getFollowerCount, isFollowing } from "@/services/follow.service";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/users/[userId]/follow-status
 * Public: anyone can see a streamer's follower count. `isFollowing` is
 * only meaningful for a signed-in viewer and is `false` otherwise.
 */
export async function followStatusController(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const session = await getCurrentSession();

    const [followerCount, following] = await Promise.all([
      getFollowerCount(userId),
      session?.user?.id ? isFollowing(session.user.id, userId) : Promise.resolve(false),
    ]);

    return json({ followerCount, isFollowing: following });
  } catch (error) {
    console.error("Follow status error:", error);
    return serverError("Failed to load follow status");
  }
}
