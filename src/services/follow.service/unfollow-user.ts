import { prisma } from "@/lib/prisma";

/** Idempotent: unfollowing someone you don't follow is a no-op, not an error. */
export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
}
