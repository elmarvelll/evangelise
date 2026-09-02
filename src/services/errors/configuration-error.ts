/** Server misconfiguration (e.g. a required env var is missing). Always maps to a 500. */
export class ConfigurationError extends Error {}
