"use client";

import { LocalAudioTrack, LocalVideoTrack, Room } from "livekit-client";
import { LiveKitTokenResponse, sendStreamSetupToToken } from "../utils/stream-session-storage";

export function useGoLive(
    videoTrack: MediaStreamTrack | null,
    audioTrack: MediaStreamTrack | null,
    roomRef: React.RefObject<Room | null>,
    setRoomId: (id: string) => void,
    setRoom: (Room: Room | null) => void,
    setIsLive: (isLive: boolean) => void,
    setLocalVideoTrack: (track: LocalVideoTrack) => void,
    setLocalAudioTrack: (track: LocalAudioTrack) => void
) {
    async function goLive() {
        try {
            const live_request: LiveKitTokenResponse =
                await sendStreamSetupToToken();
            const room = new Room();

            console.log("LiveKit URL:", process.env.NEXT_PUBLIC_LIVEKIT_URL);
            console.log("Token:", live_request.token);
            console.log("Room:", live_request.roomName);

            setRoomId(live_request.livestreamId);

            await room.connect(
                process.env.NEXT_PUBLIC_LIVEKIT_URL!,
                live_request.token
            );
            roomRef.current = room;
            setRoom(room)
            const localAudioTrack = new LocalAudioTrack(audioTrack!);
            const localVideoTrack = new LocalVideoTrack(videoTrack!);

            setLocalVideoTrack(localVideoTrack);
            setLocalAudioTrack(localAudioTrack);

            await room.localParticipant.publishTrack(
                localAudioTrack
            );

            await room.localParticipant.publishTrack(
                localVideoTrack,
                {
                    simulcast: true,
                    videoCodec: "vp8",
                    videoEncoding: {
                        maxBitrate: 1_000_000,
                        maxFramerate: 24,
                    },
                }
            );

            setIsLive(true);

            console.log("Successfully connected to LiveKit");
            console.log("Room:", live_request.roomName);
            console.log("Livestream:", live_request.livestreamId);

        } catch (error) {
            console.error("Failed to go live:", error);
            setIsLive(false);
        }
    }

    return goLive;
}