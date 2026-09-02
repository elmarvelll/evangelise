import { badRequest, conflict, json, serverError } from "@/lib/http";
import { registerUser } from "@/services/auth.service";
import { ConflictError, ValidationError } from "@/services/errors";
import { isSignupFormValues } from "@/app/utils/signupformUtils";

/**
 * POST /api/register
 */
export async function registerController(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isSignupFormValues(body)) {
      return badRequest("Invalid registration payload.");
    }

    const user = await registerUser(body);

    return json(
      {
        message: "Account created successfully.",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
      201
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return badRequest(error.message);
    }

    if (error instanceof ConflictError) {
      return conflict(error.message);
    }

    console.error("Register route error:", error);

    return serverError("Unable to create account right now.");
  }
}
