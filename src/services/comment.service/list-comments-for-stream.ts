import { prisma } from "@/lib/prisma";
import { formatRelativeTime } from "./format-relative-time";

export async function listCommentsForStream(livestreamId: string) {
  const comments = await prisma.comment.findMany({
    where: { livestreamId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return comments.map((comment) => ({
    id: comment.id,
    name: `${comment.user.firstName} ${comment.user.lastName}`.trim(),
    text: comment.text,
    time: formatRelativeTime(comment.createdAt),
  }));
}
