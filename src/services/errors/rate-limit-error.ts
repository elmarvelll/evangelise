/** Caller is sending requests too quickly. Maps to HTTP 429. */
export class RateLimitError extends Error {}
