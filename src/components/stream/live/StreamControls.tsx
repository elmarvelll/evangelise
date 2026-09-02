"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Room, Track } from "livekit-client";
import { useStream } from "../context/StreamContext";

interface StreamControlsProps {
    isLive: boolean;
    room?: Room | null;
}

export default function StreamControls({
    isLive,
    room,
}: StreamControlsProps) {
    const {
        audioTrack,
        videoTrack,
        isMicrophoneEnabled,
        isCameraEnabled,
        setIsMicrophoneEnabled,
        setIsCameraEnabled,
        localvideoTrack,
        localaudioTrack,
    } = useStream();

async function toggleMicrophone() {
    if (isLive && localaudioTrack) {
        if (localaudioTrack.isMuted) {
            await localaudioTrack.unmute();
            setIsMicrophoneEnabled(true);
        } else {
            await localaudioTrack.mute();
            setIsMicrophoneEnabled(false);
        }

        return;
    }

    // Preview audio
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMicrophoneEnabled(audioTrack.enabled);
}

async function toggleCamera() {
    // LIVE STREAM
    if (isLive && localvideoTrack) {
        if (localvideoTrack.isMuted) {
            await localvideoTrack.unmute();
            setIsCameraEnabled(true);
        } else {
            await localvideoTrack.mute();
            setIsCameraEnabled(false);
        }

        return;
    }

    // CAMERA PREVIEW
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;

    setIsCameraEnabled(videoTrack.enabled);
}

    return (
        <div className="flex items-center justify-center gap-3">
            <button
                type="button"
                onClick={toggleMicrophone}
                disabled={!audioTrack && !room}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-slate-950/80 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isMicrophoneEnabled ? (
                    <Mic size={18} />
                ) : (
                    <MicOff size={18} />
                )}
            </button>

            <button
                type="button"
                onClick={toggleCamera}
                disabled={!videoTrack && !room}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-slate-950/80 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isCameraEnabled ? (
                    <Video size={18} />
                ) : (
                    <VideoOff size={18} />
                )}
            </button>
        </div>
    );
}