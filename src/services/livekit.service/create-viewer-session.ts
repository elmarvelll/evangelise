import { AccessToken } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/services/errors";
import { getLiveKitCredentials } from "./get-livekit-credentials";

/**
 * Issues a subscribe-only token for a LIVE stream. Backs
 * `POST /api/livekit/viewer_token` — publicly reachable, since anyone
 * can watch a live stream without an account.
 */
export async function createViewerSession(livestreamId: string) {
  const livestream = await prisma.livestream.findUnique({
    where: { id: livestreamId },
  });

  if (!livestream) {
    throw new NotFoundError("Livestream not found");
  }

  if (livestream.status !== "LIVE") {
    throw new ValidationError("Livestream is no longer live");
  }

  const { apiKey, apiSecret } = getLiveKitCredentials();

  const token = new AccessToken(apiKey, apiSecret, {
    identity: `viewer-${crypto.randomUUID()}`,
  });

  token.addGrant({
    room: livestream.id,
    roomJoin: true,
    canSubscribe: true,
    canPublish: false,
  });

  return {
    token: await token.toJwt(),
    roomName: livestream.id,
  };
}
