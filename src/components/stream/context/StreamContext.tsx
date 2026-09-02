"use client";

import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

import type {
    LocalAudioTrack,
    LocalVideoTrack,
    Room,
} from "livekit-client";

interface StreamContextType {
    Stream: MediaStream | null;
    setStream: (stream: MediaStream | null) => void;

    localvideoTrack: LocalVideoTrack | null;
    setlocalvideoTrack: React.Dispatch<
        React.SetStateAction<LocalVideoTrack | null>
    >;

    localaudioTrack: LocalAudioTrack | null;
    setlocalaudioTrack: React.Dispatch<
        React.SetStateAction<LocalAudioTrack | null>
    >;
    isCameraEnabled: boolean;
    setIsCameraEnabled: React.Dispatch<React.SetStateAction<boolean>>;

    isMicrophoneEnabled: boolean;
    setIsMicrophoneEnabled: React.Dispatch<React.SetStateAction<boolean>>;

    videoTrack: MediaStreamTrack | null;
    setVideoTrack: (track: MediaStreamTrack | null) => void;

    audioTrack: MediaStreamTrack | null;
    setAudioTrack: (track: MediaStreamTrack | null) => void;

    // room: Room | null;
    // setRoom: (room: Room | null) => void;
}

const StreamContext = createContext<StreamContextType | null>(null);

export function StreamProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [Stream, setStream] =
        useState<MediaStream | null>(null);

    const [videoTrack, setVideoTrack] =
        useState<MediaStreamTrack | null>(null);

    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);

    const [audioTrack, setAudioTrack] =
        useState<MediaStreamTrack | null>(null);

    const [localvideoTrack, setlocalvideoTrack] =
        useState<LocalVideoTrack | null>(null);

    const [localaudioTrack, setlocalaudioTrack] =
        useState<LocalAudioTrack | null>(null);

    // const [room, setRoom] =
    //     useState<Room | null>(null);

    return (
        <StreamContext.Provider
            value={{
                Stream,
                setStream,

                videoTrack,
                setVideoTrack,

                audioTrack,
                setAudioTrack,

                localaudioTrack,
                setlocalaudioTrack,

                localvideoTrack,
                setlocalvideoTrack,

                isCameraEnabled,
                setIsCameraEnabled,

                isMicrophoneEnabled,
                setIsMicrophoneEnabled, 

                // room,
                // setRoom,
            }}
        >
            {children}
        </StreamContext.Provider>
    );
}

export function useStream() {
    const context = useContext(StreamContext);

    if (!context) {
        throw new Error(
            "useStream must be used inside a StreamProvider"
        );
    }

    return context;
}