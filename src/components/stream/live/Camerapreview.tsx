"use client";

import { useEffect, useRef, useState } from "react";
import { useStream } from "../context/StreamContext";
export default function CameraPreview() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const {Stream} = useStream()


    useEffect(() => {
        try {
            console.log(Stream)
            if (videoRef.current) {
                videoRef.current.srcObject = Stream;
            }
        } catch (err) {
            console.error("Camera access failed:", err);
            setError("Unable to access your camera or microphone.");
        }
        return () => {
        };
    }, [Stream]);
    if (error) {
        return (
            <div className="flex aspect-video items-center justify-center rounded-xl bg-black text-white ">
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