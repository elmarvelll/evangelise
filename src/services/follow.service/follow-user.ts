import { prisma } from "@/lib/prisma";
import { ConflictError, ValidationError } from "@/services/errors";
import { publishActivity } from "@/lib/activity-bus";

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Follows are looked up by session-derived `followerId` in the
 * controller — never by a client-supplied id — so a user can only ever
 * create a follow row on their own behalf.
 */
export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new ValidationError("You can't follow yourself.");
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });

  if (!target) {
    throw new ValidationError("That user doesn't exist.");
  }

  let follower;

  try {
    follower = await prisma.user.findUnique({ where: { id: followerId } });

    await prisma.follow.create({
      data: { followerId, followingId },
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new ConflictError("You're already following this streamer.");
    }

    throw error;
  }

  publishActivity(followingId, {
    type: "follow",
    followerId,
    followerName: follower
      ? `${follower.firstName} ${follower.lastName}`.trim()
      : "Someone",
  });
}
