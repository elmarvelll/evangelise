"use client";

import { Room } from "livekit-client";
import { sendupdate } from "../utils/stream-session-storage";

export function useEndStream(
    roomRef: React.RefObject<Room | null>,
    setIsLive: (isLive: boolean) => void,
    setRoom: (Room: Room | null) => void,

) {
    async function endStream(id: string | null) {
        if (id === null) {
            throw new Error("Invalid livestream ID");
        }

        try {
            // Disconnect from LiveKit without stopping
            // the camera/microphone.
            if (roomRef.current) {
                await roomRef.current.disconnect(false);
                roomRef.current = null;
                setRoom(null)
            }

            // Tell backend to end the livestream
            const response = await sendupdate(id);

            if (!response.success) {
                throw new Error("Couldn't update livestream");
            }

            // Switch UI back to camera preview
            setIsLive(false);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem("evangeli3e:stream-setup-draft");
            }

        } catch (error) {
            console.error("Failed to end stream:", error);
        }
    }

    return endStream;
}