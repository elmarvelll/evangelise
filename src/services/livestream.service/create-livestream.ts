import type { User } from "next-auth";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/services/errors";
import { isStreamPayload, type StreamPayload } from "./is-stream-payload";
import { isStringArray } from "./is-string-array";

/**
 * Validates a stream-setup payload and creates the livestream row for it.
 *
 * NOTE (pre-existing bug, kept as-is): the owning user is looked up by
 * `session.email?.toUpperCase()`, but emails are stored lowercase
 * everywhere else in the app (see `auth.service`). This lookup will
 * only ever match a user whose email happens to be all-uppercase in the
 * database, which in practice is never. Left unchanged during this
 * refactor per "preserve existing behavior" — flagged here and in
 * docs/architecture.md for a follow-up fix.
 */
export async function createLivestream(body: StreamPayload, sessionUser: User) {
  if (!isStreamPayload(body)) {
    throw new ValidationError("Invalid livestream payload.");
  }

  const sessionName = typeof body.sessionName === "string" ? body.sessionName.trim() : "";
  const sessionDescription =
    typeof body.sessionDescription === "string" ? body.sessionDescription.trim() : "";
  const selectedTags = isStringArray(body.selectedTags) ? body.selectedTags : [];
  const interactionsEnabled = Boolean(body.interactionsEnabled);
  const streamMode = body.streamMode === "schedule" ? "schedule" : "now";
  const scheduleDate =
    typeof body.scheduleDate === "string" && body.scheduleDate.trim().length > 0
      ? new Date(body.scheduleDate)
      : null;

  if (!sessionName || !sessionDescription) {
    throw new ValidationError("Session name and description are required.");
  }

  if (selectedTags.length > 3) {
    throw new ValidationError("You can only choose up to 3 tags.");
  }

  if (streamMode === "schedule" && (!scheduleDate || Number.isNaN(scheduleDate.getTime()))) {
    throw new ValidationError("Please choose a valid schedule date.");
  }

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email?.toUpperCase() },
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  const livestream = await prisma.livestream.create({
    data: {
      sessionName,
      sessionDescription,
      selectedTags,
      interactionsEnabled,
      status: "LIVE",
      scheduleDate: streamMode === "schedule" ? scheduleDate : null,
      userId: user.id,
      endedAt: null,
    },
    include: {
      user: true,
    },
  });

  return livestream;
}
