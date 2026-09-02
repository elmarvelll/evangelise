import type { StreamCategory, StreamGenre } from "@prisma/client";

export type LivestreamStatus = "LIVE" | "SCHEDULED";

export type LivestreamItem = {
  id: string;
  userId: string;
  sessionName: string | null;
  sessionDescription: string | null;
  selectedTags: string[];
  category: StreamCategory;
  genre: StreamGenre;
  donationEnabled: boolean;
  donationBankName: string | null;
  donationAccountName: string | null;
  donationAccountNumber: string | null;
  status: LivestreamStatus;
  user: {
    firstName: string | null;
    lastName: string | null;
  } | null;
};
