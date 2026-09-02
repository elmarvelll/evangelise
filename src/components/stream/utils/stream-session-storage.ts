import type { StreamSetupValues } from "@/components/stream/utils/types";
import api from "@/lib/axios";
export interface LiveKitTokenResponse {
  token: string;
  livestreamId: string;
  roomName: string;
  message: string;
}

export const streamSetupDraftKey = "evangeli3e:stream-setup-draft";

export function isStreamSetupComplete(
  values: Partial<Pick<StreamSetupValues, "sessionName" | "sessionDescription" | "selectedTags">>,
) {
  return (
    typeof values.sessionName === "string" &&
    values.sessionName.trim().length > 0 &&
    typeof values.sessionDescription === "string" &&
    values.sessionDescription.trim().length > 0 &&
    Array.isArray(values.selectedTags) &&
    values.selectedTags.length > 0
  );
}

export function readStreamSetupDraft(): Partial<StreamSetupValues> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(streamSetupDraftKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Partial<StreamSetupValues>;
  } catch {
    return null;
  }
}

export function writeStreamSetupDraft(values: StreamSetupValues) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(streamSetupDraftKey, JSON.stringify(values));
}

export async function sendStreamSetupToToken() {
  if (typeof window === "undefined") {
    throw new Error("This function must run in the browser");
  }

  const raw = window.localStorage.getItem(streamSetupDraftKey);

  if (!raw) {
    throw new Error("No stream setup found");
  }

  let values: Partial<StreamSetupValues>;

  try {
    values = JSON.parse(raw);
  } catch {
    throw new Error("Invalid stream setup data");
  }

  const response = await api.post('/livekit/token', values)
  return response.data

}

export async function sendupdate(id: string) {
  const response = await api.post('livekit/livestreams/end',{
    id
  })
   return response.data
}