import api from "@/lib/axios";

export async function restoreLivestreams() {
  const response = await api.get("/livestreams/active");
     const data = await response.data

  return data;
}