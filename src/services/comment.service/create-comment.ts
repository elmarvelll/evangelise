import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/services/errors";

const MAX_COMMENT_LENGTH = 500;

export async function createComment(livestreamId: string, userId: string, rawText: string) {
  const text = rawText?.trim();

  if (!text) {
    throw new ValidationError("Comment cannot be empty");
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    throw new ValidationError("Comment is too long");
  }

  const livestream = await prisma.livestream.findUnique({
    where: { id: livestreamId },
  });

  if (!livestream) {
    throw new NotFoundError("Livestream not found");
  }

  const comment = await prisma.comment.create({
    data: {
      text,
      userId,
      livestreamId,
    },
    include: { user: true },
  });

  return {
    id: comment.id,
    name: `${comment.user.firstName} ${comment.user.lastName}`.trim(),
    text: comment.text,
    time: "Just now",
  };
}
