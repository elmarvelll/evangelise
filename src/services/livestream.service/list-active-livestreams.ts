import { prisma } from "@/lib/prisma";

/**
 * Public feed of every livestream currently LIVE, most recent first.
 * Used by the home dashboard.
 */
export async function listActiveLivestreams() {
  const livestreams = await prisma.livestream.findMany({
    where: {
      status: "LIVE",
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return livestreams.map((livestream) => ({
    id: livestream.id,
    sessionName: livestream.sessionName,
    sessionDescription: livestream.sessionDescription,
    selectedTags: Array.isArray(livestream.selectedTags)
      ? livestream.selectedTags.filter((tag): tag is string => typeof tag === "string")
      : [],
    status: livestream.status,
    user: {
      firstName: livestream.user.firstName,
      lastName: livestream.user.lastName,
    },
  }));
}
