import api from "@/lib/axios";
import { LocalAudioTrack, LocalVideoTrack, Room } from "livekit-client";
import { useStream } from "../context/StreamContext";


export default function useReconnectToLiveKit() {
    const { setlocalvideoTrack, setlocalaudioTrack } = useStream();
    async function reconnectToLiveKit(livestream: {
        id: string;
        roomName: string;
    },
        setroomId: (id: string) => void,
        setIsLive: (isLive: boolean) => void,
        roomRef: React.RefObject<Room | null>,
    setRoom: (Room: Room | null) => void,

    ) {
        try {
            console.log("Reconnecting to livestream:", livestream.id);

            // 1. Get a fresh token for the existing livestream
            const response = await api.post('/livekit/token/reconnect', {
                livestreamId: livestream.id,
            });

            const live_request = response.data;

            // 2. Create a new LiveKit room
            const room = new Room();

            // 3. Connect to the existing room
            await room.connect(
                process.env.NEXT_PUBLIC_LIVEKIT_URL!,
                live_request.token
            );

                        roomRef.current = room;
            setRoom(room)

            // 4. Get camera + microphone again
            const mediaStream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

            const videoTrack = mediaStream.getVideoTracks()[0];
            const audioTrack = mediaStream.getAudioTracks()[0];

            // 5. Turn MediaStreamTracks into LiveKit tracks
            const localVideoTrack = new LocalVideoTrack(videoTrack);

            const localAudioTrack = new LocalAudioTrack(audioTrack);

            // 6. Save tracks to context so mute/unmute controls
            // (StreamControls.tsx) can operate on the actual published
            // LiveKit tracks after a reconnect, not just the raw preview
            // MediaStreamTrack.
            setlocalvideoTrack(localVideoTrack);
            setlocalaudioTrack(localAudioTrack);

            // 7. Publish microphone
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
            setroomId(livestream.id);
            setIsLive(true);

            console.log("Successfully reconnected to LiveKit");

        } catch (error) {
            console.error("Failed to reconnect:", error);
            setIsLive(false);
        }
    }
    return reconnectToLiveKit
}