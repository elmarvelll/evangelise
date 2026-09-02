export type LivestreamStatus = "LIVE" | "SCHEDULED";

export type LivestreamItem = {
  id: string;
  sessionName: string | null;
  sessionDescription: string | null;
  selectedTags: string[];
  status: LivestreamStatus;
  user: {
    firstName: string | null;
    lastName: string | null;
  } | null;
};
