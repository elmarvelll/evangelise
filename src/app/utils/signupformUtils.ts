import { SignupFormValues } from "@/types/auth";

export function isSignupFormValues(value: unknown): value is SignupFormValues {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.firstName === "string" &&
        typeof candidate.lastName === "string" &&
        typeof candidate.email === "string" &&
        typeof candidate.password === "string"
    );
}
