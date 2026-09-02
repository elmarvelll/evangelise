import type { StreamCategory, StreamGenre } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export type SearchLivestreamsParams = {
  search?: string;
  category?: StreamCategory;
  genre?: StreamGenre;
  cursor?: string;
  limit?: number;
};

/**
 * The single query behind `GET /api/livestreams`: the plain "all live
 * streams" feed (no params) and every search/filter combination
 * (`search`, `category`, `genre`, independently or combined) are the
 * same database query with optional `AND` clauses — there's no separate
 * "list" query to keep in sync with the "search" query.
 *
 * Always queries the database directly (no in-memory filtering of a
 * full table scan) and always paginates via `take`/cursor — never
 * returns an unbounded result set.
 */
export async function searchLivestreams(params: SearchLivestreamsParams) {
  const search = params.search?.trim();
  const take = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  const livestreams = await prisma.livestream.findMany({
    where: {
      AND: [
        { status: "LIVE" },
        ...(search
          ? [
              {
                OR: [
                  { sessionName: { contains: search } },
                  { sessionDescription: { contains: search } },
                ],
              },
            ]
          : []),
        ...(params.category ? [{ category: params.category }] : []),
        ...(params.genre ? [{ genre: params.genre }] : []),
      ],
    },

    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: take + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
  });

  const hasMore = livestreams.length > take;
  const page = hasMore ? livestreams.slice(0, take) : livestreams;

  return {
    livestreams: page.map((livestream) => ({
      id: livestream.id,
      userId: livestream.userId,
      sessionName: livestream.sessionName,
      sessionDescription: livestream.sessionDescription,
      selectedTags: Array.isArray(livestream.selectedTags)
        ? livestream.selectedTags.filter((tag): tag is string => typeof tag === "string")
        : [],
      category: livestream.category,
      genre: livestream.genre,
      status: livestream.status,
      donationEnabled: livestream.donationEnabled,
      donationBankName: livestream.donationBankName,
      donationAccountName: livestream.donationAccountName,
      donationAccountNumber: livestream.donationAccountNumber,
      user: {
        firstName: livestream.user.firstName,
        lastName: livestream.user.lastName,
      },
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
