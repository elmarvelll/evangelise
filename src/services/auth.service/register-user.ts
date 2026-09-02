import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { ConflictError, ValidationError } from "@/services/errors";
import { findUserByEmail } from "./find-user-by-email";
import { isPrismaUniqueConstraintError } from "./is-prisma-unique-constraint-error";

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

/**
 * Creates a new credentials-based account. Throws `ValidationError` for
 * bad input and `ConflictError` when the email is already registered
 * (checked up front, and again against the database's unique
 * constraint to close the race between two concurrent signups).
 */
export async function registerUser(input: RegisterInput) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!firstName || !lastName || !email || !password) {
    throw new ValidationError("Please fill out every field.");
  }

  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ConflictError("An account with that email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    return await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new ConflictError("An account with that email already exists.");
    }

    throw error;
  }
}
