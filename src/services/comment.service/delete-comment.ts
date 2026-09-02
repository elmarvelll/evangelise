import { prisma } from "@/lib/prisma";
import { NotFoundError, UnauthorizedError } from "@/services/errors";

/**
 * Soft-deletes a comment (sets `deletedAt` rather than removing the
 * row) so moderation stays auditable. Only the comment's own author or
 * the livestream's owner may delete it — checked against the
 * comment/livestream rows themselves, never trusting a client-supplied
 * "I own this" claim.
 */
export async function deleteComment(commentId: string, requestingUserId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { livestream: { select: { userId: true } } },
  });

  if (!comment || comment.deletedAt) {
    throw new NotFoundError("Comment not found");
  }

  const isAuthor = comment.userId === requestingUserId;
  const isStreamOwner = comment.livestream.userId === requestingUserId;

  if (!isAuthor && !isStreamOwner) {
    throw new UnauthorizedError("You can't delete this comment.");
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
}
