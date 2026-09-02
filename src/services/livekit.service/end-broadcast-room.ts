import { RoomServiceClient } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/services/errors";
import { endLivestream } from "@/services/livestream.service";
import { getLiveKitCredentials } from "./get-livekit-credentials";

/**
 * Tears down the LiveKit room and marks the livestream ENDED. Backs
 * `POST /api/livekit/livestreams/end`.
 *
 * NOTE (pre-existing behavior, kept as-is): unlike the other LiveKit
 * routes, this one performs no session/ownership check — any caller who
 * knows a livestream id can end it. Flagged in docs/architecture.md as
 * a security follow-up rather than changed here.
 */
export async function endBroadcastRoom(livestreamId: string) {
  const livestream = await prisma.livestream.findUnique({
    where: { id: livestreamId },
  });

  if (!livestream) {
    throw new NotFoundError("Livestream not found");
  }

  const { apiKey, apiSecret } = getLiveKitCredentials();

  const roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL!,
    apiKey,
    apiSecret
  );

  // End the LiveKit room first, same order as the original route handler:
  // if this throws, the livestream is intentionally left LIVE rather than
  // marked ENDED with a room that failed to tear down.
  await roomService.deleteRoom(livestreamId);

  return endLivestream(livestreamId);
}
