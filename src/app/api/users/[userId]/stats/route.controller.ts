import { serverError, unauthorized } from "@/lib/http";
import { json } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { getStreamerOverview } from "@/services/viewer-stats.service";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/users/[userId]/stats
 * A streamer's own aggregate stats (follower count, lifetime views,
 * total streams). Private: only viewable by the user themselves.
 */
export async function streamerStatsController(request: Request, { params }: RouteParams) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { userId } = await params;

  if (session.user.id !== userId) {
    return unauthorized("You can only view your own statistics.");
  }

  try {
    const overview = await getStreamerOverview(userId);
    return json(overview);
  } catch (error) {
    console.error("Streamer stats error:", error);
    return serverError("Failed to load statistics");
  }
}
