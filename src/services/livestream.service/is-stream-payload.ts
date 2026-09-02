export type StreamPayload = {
  sessionName?: unknown;
  sessionDescription?: unknown;
  selectedTags?: unknown;
  interactionsEnabled?: unknown;
  streamMode?: unknown;
  scheduleDate?: unknown;
};

export function isStreamPayload(value: unknown): value is StreamPayload {
  return typeof value === "object" && value !== null;
}
