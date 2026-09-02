import { badRequest, json, unauthorized } from "@/lib/http";
import { getCurrentSession } from "@/lib/session";
import { createReport } from "@/services/report.service";
import { ValidationError } from "@/services/errors";

/**
 * POST /api/reports
 * Reports a livestream or comment for later human review.
 */
export async function createReportController(request: Request) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    await createReport(session.user.id, body.targetType, body.targetId, body.reason);

    return json({ success: true }, 201);
  } catch (error) {
    if (error instanceof ValidationError) {
      return badRequest(error.message);
    }

    throw error;
  }
}
