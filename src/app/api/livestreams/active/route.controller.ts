import { json, serverError, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { getActiveLivestreamForUser } from "@/services/livestream.service";
import { getLiveViewerCount } from "@/services/viewer-stats.service";

/**
 * GET /api/livestreams/active
 * The signed-in user's own active livestream, used to restore the
 * broadcaster dashboard after a refresh. Includes the current live
 * viewer count (read straight from LiveKit — see
 * `viewer-stats.service/get-live-viewer-count.ts`) so the dashboard
 * doesn't need a second request just for that number.
 */
export async function getActiveLivestreamController() {
  try {
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return unauthorized();
    }

    const livestream = await getActiveLivestreamForUser(session.user.id);

    if (!livestream) {
      return json({ isLive: false, livestream: null });
    }

    const currentViewerCount = await getLiveViewerCount(livestream.id, session.user.id);

    return json({ isLive: true, livestream: { ...livestream, currentViewerCount } });
  } catch (error) {
    console.error("Failed to get active livestream:", error);
    return serverError("Failed to get active livestream");
  }
}
