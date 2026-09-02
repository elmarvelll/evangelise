import bcrypt from "bcrypt";
import { findUserByEmail } from "./find-user-by-email";

/**
 * Verifies an email/password pair against the stored (bcrypt-hashed)
 * password. Returns the user record on success, `null` on any failure
 * (unknown email, no password set e.g. a Google-only account, or a
 * mismatch) — callers should not distinguish between these cases.
 */
export async function verifyCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user || !user.password) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return null;
  }

  return user;
}
