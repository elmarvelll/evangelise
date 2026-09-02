import type { StreamCategory, StreamGenre } from "@prisma/client";

export type StreamSetupValues = {
  sessionName: string;
  sessionDescription: string;
  selectedTags: string[];
  category: StreamCategory | "";
  genre: StreamGenre | "";
  interactionsEnabled: boolean;
  donationEnabled: boolean;
  donationBankName: string;
  donationAccountName: string;
  donationAccountNumber: string;
};

export const christianTags = [
  "Prosperity",
  "Fruit of the womb",
  "Worship",
  "Open doors",
  "Healing",
  "Deliverance",
  "Breakthrough",
  "Faith",
  "Salvation",
  "Revival",
  "Prayer",
  "Fasting",
  "Grace",
  "Mercy",
  "Thanksgiving",
  "Evangelism",
  "Spiritual warfare",
  "Divine favor",
  "Peace",
  "Guidance",
];
