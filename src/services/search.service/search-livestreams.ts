import { prisma } from "@/lib/prisma";

/**
 * Searches currently-LIVE streams by session name/description text and
 * by tag. Both `query` and `filters` are optional; when both are empty
 * the caller should skip calling this (see `search.controller.ts`) —
 * an unfiltered scan of all live streams is never a useful "search".
 */
export async function searchLivestreams(query: string, filters: string[]) {
  const livestreams = await prisma.livestream.findMany({
    where: {
      AND: [
        { status: "LIVE" },
        ...(query
          ? [
              {
                OR: [
                  { sessionName: { contains: query } },
                  { sessionDescription: { contains: query } },
                ],
              },
            ]
          : []),

        // Christian tag filters
        ...(filters.length > 0
          ? [
              {
                OR: filters.map((tag) => ({
                  selectedTags: {
                    array_contains: [tag],
                  },
                })),
              },
            ]
          : []),
      ],
    },

    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 20,
  });

  return livestreams.map((stream) => ({
    id: stream.id,
    type: "livestream",
    name: `${stream.user.firstName} ${stream.user.lastName}`,
    title: stream.sessionName,
    subtitle: stream.sessionDescription,
    tags: Array.isArray(stream.selectedTags) ? stream.selectedTags : [],
  }));
}
