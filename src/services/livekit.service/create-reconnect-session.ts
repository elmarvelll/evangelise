import { AccessToken } from "livekit-server-sdk";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/services/errors";
import { getLiveKitCredentials } from "./get-livekit-credentials";

/**
 * Issues a fresh publisher token for a livestream the caller already
 * owns and that is still LIVE. Backs `POST /api/livekit/token/reconnect`,
 * used when the broadcaster's connection drops and needs to resume the
 * same room without creating a new livestream row.
 */
export async function createReconnectSession(livestreamId: string, userId: string) {
  const { apiKey, apiSecret } = getLiveKitCredentials();

  const livestream = await prisma.livestream.findFirst({
    where: {
      id: livestreamId,
      userId,
      status: "LIVE",
    },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!livestream) {
    throw new NotFoundError("Active livestream not found");
  }

  const roomName = livestream.id;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: livestream.userId,
    ttl: "1h",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return {
    token: await token.toJwt(),
    livestreamId: livestream.id,
    roomName,
    message: "LiveKit reconnect token created successfully",
  };
}
