"use client";
import { useEffect, useRef, useState } from "react";
import { useStream } from "../context/StreamContext";
export default function LiveVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const { localvideoTrack } = useStream()

    useEffect(() => {
        async function startCamera() {
            try {
                if (!videoRef.current || !localvideoTrack) {
                    throw new Error('invalid video')
                }
                localvideoTrack.attach(videoRef.current)
            } catch (err) {
                console.error("Camera access failed:", err);
                setError("Unable to access your camera or microphone.");
            }
        }
        startCamera();

        return () => {
            localvideoTrack && localvideoTrack.detach(videoRef.current!);
        };
    }, [localvideoTrack]);
    if (error) {
        return (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-black text-white">
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className="relative rounded-[10px] aspect-video bg-black scale-x-[-1]">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
            />

            <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm tracking-[0.3em] text-white">
                LIVE SCREEN
            </div>
        </div>
    );
}