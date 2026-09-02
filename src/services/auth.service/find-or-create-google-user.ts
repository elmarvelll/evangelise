import { prisma } from "@/lib/prisma";
import { findUserByEmail } from "./find-user-by-email";

/**
 * Looks up the user for a Google sign-in, creating one on first login.
 * New Google accounts get an empty `password`, which keeps them out of
 * the credentials login path (see `verifyCredentials`).
 */
export async function findOrCreateGoogleUser(email: string, displayName?: string | null) {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const nameParts = displayName?.trim().split(/\s+/) ?? [];
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: "",
    },
  });
}
