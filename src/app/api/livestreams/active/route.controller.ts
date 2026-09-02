import { json, serverError, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { getActiveLivestreamForUser } from "@/services/livestream.service";

/**
 * GET /api/livestreams/active
 * The signed-in user's own active livestream, used to restore the
 * broadcaster dashboard after a refresh.
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

    return json({ isLive: true, livestream });
  } catch (error) {
    console.error("Failed to get active livestream:", error);
    return serverError("Failed to get active livestream");
  }
}
