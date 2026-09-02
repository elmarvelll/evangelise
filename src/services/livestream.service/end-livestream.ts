import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/services/errors";

/** Marks a livestream ENDED, e.g. when the broadcaster stops streaming. */
export async function endLivestream(livestreamId: string) {
  const livestream = await prisma.livestream.findUnique({
    where: { id: livestreamId },
  });

  if (!livestream) {
    throw new NotFoundError("Livestream not found");
  }

  await prisma.livestream.update({
    where: { id: livestreamId },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  return livestream;
}
