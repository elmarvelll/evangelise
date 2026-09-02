import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** Cursor-paginated list of a user's followers, newest first. */
export async function listFollowers(userId: string, cursor?: string, limit = DEFAULT_LIMIT) {
  const take = Math.min(Math.max(limit, 1), MAX_LIMIT);

  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      follower: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  return {
    followers: page.map((row) => ({
      id: row.follower.id,
      firstName: row.follower.firstName,
      lastName: row.follower.lastName,
      avatarUrl: row.follower.avatarUrl,
      followedAt: row.createdAt,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
