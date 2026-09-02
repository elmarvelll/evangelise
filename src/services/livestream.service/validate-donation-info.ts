import { ValidationError } from "@/services/errors";

export type DonationInfo = {
  donationEnabled: boolean;
  donationBankName: string | null;
  donationAccountName: string | null;
  donationAccountNumber: string | null;
};

/**
 * Donations are bank-transfer details a viewer can use to support the
 * streamer directly — not an in-app payment system. When enabled, all
 * three fields are required; a partially-filled-in donation section is
 * useless to a viewer and worse than none at all, so it's rejected
 * rather than silently saved incomplete.
 */
export function parseDonationInfo(body: {
  donationEnabled?: unknown;
  donationBankName?: unknown;
  donationAccountName?: unknown;
  donationAccountNumber?: unknown;
}): DonationInfo {
  const donationEnabled = Boolean(body.donationEnabled);

  const donationBankName =
    typeof body.donationBankName === "string" ? body.donationBankName.trim() : "";
  const donationAccountName =
    typeof body.donationAccountName === "string" ? body.donationAccountName.trim() : "";
  const donationAccountNumber =
    typeof body.donationAccountNumber === "string" ? body.donationAccountNumber.trim() : "";

  if (!donationEnabled) {
    return {
      donationEnabled: false,
      donationBankName: null,
      donationAccountName: null,
      donationAccountNumber: null,
    };
  }

  if (!donationBankName || !donationAccountName || !donationAccountNumber) {
    throw new ValidationError(
      "Bank name, account name, and account number are all required when donations are enabled."
    );
  }

  return {
    donationEnabled: true,
    donationBankName,
    donationAccountName,
    donationAccountNumber,
  };
}
