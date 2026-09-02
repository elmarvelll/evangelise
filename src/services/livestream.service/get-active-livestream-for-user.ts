import { prisma } from "@/lib/prisma";

/**
 * The signed-in user's own currently-LIVE stream, if any. Used to
 * restore the broadcaster's dashboard after a page refresh.
 */
export async function getActiveLivestreamForUser(userId: string) {
  return prisma.livestream.findFirst({
    where: {
      userId,
      status: "LIVE",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });
}
