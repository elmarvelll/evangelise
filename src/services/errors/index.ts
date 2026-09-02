/**
 * Typed error classes services can throw to signal *expected* failure
 * modes (bad input, missing record, conflict, etc). Controllers catch
 * these and translate them into the matching HTTP response, keeping
 * that mapping in one place instead of duplicated per route.
 *
 * Anything a service does NOT throw as one of these is treated as an
 * unexpected error by the controller and turned into a generic 500,
 * matching the app's existing error contract (no internal details are
 * ever sent to the client).
 */

export { ValidationError } from "./validation-error";
export { UnauthorizedError } from "./unauthorized-error";
export { NotFoundError } from "./not-found-error";
export { ConflictError } from "./conflict-error";
export { ConfigurationError } from "./configuration-error";
