import type { ReportTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/services/errors";

const MAX_REASON_LENGTH = 500;
const VALID_TARGET_TYPES: ReportTargetType[] = ["LIVESTREAM", "COMMENT"];

/**
 * Stores a report for later human review. There is no admin UI in this
 * MVP to act on reports — this is intentionally the simplest thing that
 * gets abuse reports into the database instead of nowhere, per the
 * "don't over-engineer moderation for an MVP" guidance.
 */
export async function createReport(
  reporterId: string,
  targetType: unknown,
  targetId: unknown,
  reason: unknown
) {
  if (typeof targetType !== "string" || !VALID_TARGET_TYPES.includes(targetType as ReportTargetType)) {
    throw new ValidationError("targetType must be LIVESTREAM or COMMENT.");
  }

  if (typeof targetId !== "string" || !targetId.trim()) {
    throw new ValidationError("targetId is required.");
  }

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";

  if (!trimmedReason) {
    throw new ValidationError("A reason is required.");
  }

  if (trimmedReason.length > MAX_REASON_LENGTH) {
    throw new ValidationError("Reason is too long.");
  }

  return prisma.report.create({
    data: {
      reporterId,
      targetType: targetType as ReportTargetType,
      targetId,
      reason: trimmedReason,
    },
  });
}
