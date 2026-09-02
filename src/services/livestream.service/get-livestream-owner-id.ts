import { prisma } from "@/lib/prisma";

/** Returns the owning user's id for a livestream, or `null` if it doesn't exist. */
export async function getLivestreamOwnerId(livestreamId: string): Promise<string | null> {
  const livestream = await prisma.livestream.findUnique({
    where: { id: livestreamId },
    select: { userId: true },
  });

  return livestream?.userId ?? null;
}
