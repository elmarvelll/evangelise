import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";

/**
 * GET /api/test
 * Simple database connectivity check.
 */
export async function healthCheckController() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return json({
      success: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("DATABASE TEST ERROR:", error);

    return json(
      {
        success: false,
        message: "Database connection failed",
      },
      500
    );
  }
}
