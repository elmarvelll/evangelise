import { prisma } from "@/lib/prisma";
import { NotFoundError, RateLimitError, ValidationError } from "@/services/errors";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_COMMENT_LENGTH = 500;
const COMMENT_RATE_LIMIT = 5;
const COMMENT_RATE_WINDOW_MS = 10_000; // 5 comments per 10 seconds per user

export async function createComment(livestreamId: string, userId: string, rawText: string) {
  if (!checkRateLimit(`comment:${userId}`, COMMENT_RATE_LIMIT, COMMENT_RATE_WINDOW_MS)) {
    throw new RateLimitError("You're commenting too quickly. Please slow down.");
  }

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
    userId: comment.userId,
    name: `${comment.user.firstName} ${comment.user.lastName}`.trim(),
    text: comment.text,
    time: "Just now",
  };
}
