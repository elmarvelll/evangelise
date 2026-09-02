export type StreamPayload = {
  sessionName?: unknown;
  sessionDescription?: unknown;
  selectedTags?: unknown;
  category?: unknown;
  genre?: unknown;
  interactionsEnabled?: unknown;
  streamMode?: unknown;
  scheduleDate?: unknown;
  donationEnabled?: unknown;
  donationBankName?: unknown;
  donationAccountName?: unknown;
  donationAccountNumber?: unknown;
};

export function isStreamPayload(value: unknown): value is StreamPayload {
  return typeof value === "object" && value !== null;
}
