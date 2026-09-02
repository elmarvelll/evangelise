"use client";

import {
    createContext,
    useContext,
    useRef,
    useState,
    useEffect,
    type ReactNode,
} from "react";

import type { Room } from "livekit-client";
import type { LivestreamItem } from "@/types/livestream-types";
import { Comment } from "../comments-rail";

export interface ViewerTokenResponse {
    token: string;
    roomName: string;
}

interface LiveStreamContextType {
    // Available livestreams
    streams: LivestreamItem[];
    setStreams: React.Dispatch<React.SetStateAction<LivestreamItem[]>>;
    // Currently selected livestream
    selectedStreamId: string | null;
    setSelectedStreamId: React.Dispatch<React.SetStateAction<string | null>>;

    comments: Comment[]
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>;

    // Viewer LiveKit token
    livestream: ViewerTokenResponse | null;
    setLivestream: React.Dispatch<
        React.SetStateAction<ViewerTokenResponse | null>
    >;
    // LiveKit room
    roomRef: React.RefObject<Room | null>;
    // Loading state
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;

    tokenLoading: boolean;
    setTokenLoading: React.Dispatch<React.SetStateAction<boolean>>;

    roomId: string | null;
    setroomId: React.Dispatch<React.SetStateAction<string | null>>;

    // Connection state
    isConnected: boolean;
    setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;

    room: Room | null;
    setRoom: (room: Room | null) => void;
}

const LiveStreamContext = createContext<
    LiveStreamContextType | undefined
>(undefined);

export default function LiveStreamProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [streams, setStreams] = useState<LivestreamItem[]>([]);
    const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [room, setRoom] = useState<Room | null>(null);
    const [livestream, setLivestream] = useState<ViewerTokenResponse | null>(null);
    const [roomId, setroomId] = useState<string | null>(null)

    const [loading, setLoading] = useState(true);
    const [tokenLoading, setTokenLoading] = useState(false);

    const [isConnected, setIsConnected] = useState(false);

    const roomRef = useRef<Room | null>(null);

    useEffect(() => {
        const activeId = selectedStreamId || roomId;
        if (!activeId) {
            setComments([]);
            return;
        }

        let active = true;
        const fetchComments = async () => {
            try {
                const response = await fetch(`/api/livestreams/comments/${activeId}`);
                if (response.ok && active) {
                    const data = await response.json();
                    setComments(data);
                }
            } catch (error) {
                console.error("Failed to load comments:", error);
            }
        };

        fetchComments();
        return () => {
            active = false;
        };
    }, [selectedStreamId, roomId]);

    return (
        <LiveStreamContext.Provider
            value={{
                streams,
                setStreams,

                selectedStreamId,
                setSelectedStreamId,

                comments,
                setComments,

                livestream,
                setLivestream,

                roomRef,

                room,
                setRoom,

                roomId,
                setroomId,

                loading,
                setLoading,

                tokenLoading,
                setTokenLoading,

                isConnected,
                setIsConnected,
            }}
        >
            {children}
        </LiveStreamContext.Provider>
    );
}

export function useLiveStream() {
    const context = useContext(LiveStreamContext);

    if (!context) {
        throw new Error(
            "useLiveStream must be used inside LiveStreamProvider"
        );
    }

    return context;
}