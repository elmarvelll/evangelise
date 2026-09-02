import { prisma } from "@/lib/prisma";

export async function getFollowerCount(userId: string) {
  return prisma.follow.count({ where: { followingId: userId } });
}
