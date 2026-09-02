// import { Eye, Heart, Mic, SendHorizontal, UserPlus, Users, Video } from "lucide-react"
import { SendHorizontal } from "lucide-react"
import InfoCard from "./InfoCard"
// import StatCard from "./StatCard"
import { useEffect, useState } from "react";
import CameraPreview from "./Camerapreview";
import LiveVideo from "./LiveVideo";
import { useStream } from "../context/StreamContext";
import { useLiveStream } from "@/components/home/Context/Home_context";
import { useCommentListener } from "@/components/home/utils/comment_Setup";
import { useSendComment } from "@/components/home/utils/comment_send";
import StreamControls from "./StreamControls";

interface LiveViewProps {
    isLive: boolean
}


export default function LiveView({ isLive }: LiveViewProps) {
    const { setStream, setAudioTrack, setVideoTrack } = useStream()
    const { comments, roomId, room } = useLiveStream()
    useCommentListener();
    const { commentText, handleSubmit, setText } = useSendComment(roomId);
    const [streamData, setStreamData] = useState<{
        sessionName?: string;
        sessionDescription?: string;
        selectedTags?: string[] | unknown;
        interactionsEnabled?: boolean;
        scheduleDate?: string | null;
    } | null>(null);

    useEffect(() => {
        if (isLive) {
            const fetchActiveStream = async () => {
                try {
                    const response = await fetch("/api/livestreams/active");
                    if (response.ok) {
                        const data = await response.json();
                        if (data.isLive && data.livestream) {
                            setStreamData(data.livestream);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch active livestream details:", error);
                }
            };
            fetchActiveStream();
        } else {
            if (typeof window !== "undefined") {
                const draft = window.localStorage.getItem("evangeli3e:stream-setup-draft");
                if (draft) {
                    try {
                        setStreamData(JSON.parse(draft));
                    } catch (e) {
                        console.error("Failed to parse stream setup draft:", e);
                    }
                }
            }
        }
    }, [isLive]);

    useEffect(() => {
        console.log(comments)
    }, [comments])
    useEffect(() => {
        let stream: MediaStream | null = null;

        async function startCamera() {
            try {
                console.log("Starting camera access...");
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30, max: 30 },
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });
                console.log("Camera access granted:", stream);
                const videoMediaTrack = stream.getVideoTracks()[0];
                const audioMediaTrack = stream.getAudioTracks()[0];
                setAudioTrack(audioMediaTrack)
                setVideoTrack(videoMediaTrack)
                setStream(stream)
                console.log(stream)
            } catch (err) {
                console.error("Camera access failed:", err);
            }
        }
        startCamera();

        return () => {
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const tags = Array.isArray(streamData?.selectedTags)
        ? streamData.selectedTags.join(", ")
        : typeof streamData?.selectedTags === "string"
            ? streamData.selectedTags
            : "";

    const scheduleStr = streamData?.scheduleDate
        ? new Date(streamData.scheduleDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
        : "N/A";

    const streamerDetails = [
        { label: "Session name", value: streamData?.sessionName || "Worship Session" },
        { label: "Session description", value: streamData?.sessionDescription || "No description provided." },
        { label: "Stream category", value: "Worship / Fellowship" },
        { label: "Selected tags", value: tags || "None" },
        { label: "Interaction mode", value: streamData?.interactionsEnabled !== false ? "Enabled" : "Disabled" },
        { label: "Status", value: isLive ? "Live" : "Scheduled" },
        { label: "Schedule date", value: scheduleStr },
    ];

    return (
        <div className="grid min-h-0 gap-3 grid-cols-[0.9fr_1.5fr_0.9fr]">
            <section className="min-h-0 rounded-[10px] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl overflow-y-auto scroll-black">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col flex-wrap gap-4">
                        {streamerDetails.map((item) => (
                            <InfoCard key={item.label} label={item.label} value={item.value} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid min-h-0 gap-5 xl:grid-rows-[auto_auto_1fr] overflow-y-auto scroll-black">
                <div className="relative overflow-hidden rounded-[10px]">
                    {isLive ? <LiveVideo /> : <CameraPreview />}

                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
                        <StreamControls
                            isLive={isLive}
                            room={room}
                        />
                    </div>
                </div>                <div className="rounded-[10px] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
                    <div className="flex items-center pb-1">
                        <p className="text-xs tracking-[0.2em] uppercase text-cyan-200/70">
                            Comments
                        </p>
                    </div>
                    {comments.map((comment) => (
                        <div
                            key={comment.id || `${comment.name}-${comment.time}-${comment.text}`}
                            className="rounded-2xl px-2 py-1 transition"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-white">
                                    <span className="text-xs text-white/60 pr-2">{comment.time} </span>
                                    <span>{comment.name}</span> : {comment.text}
                                </span>
                            </div>
                        </div>
                    ))}
                    <form
                        onSubmit={handleSubmit}
                        className="mt-4 border-t border-white/10 pt-4"
                    >
                        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-1 py-1 focus-within:border-cyan-400/30">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(event) => setText(event.target.value)}
                                placeholder="Write a comment..."
                                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                            />
                            <button
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-cyan-100 transition hover:bg-cyan-400/25"
                                aria-label="Send comment"
                            >
                                <SendHorizontal size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="grid min-h-0 gap-5 xl:grid-rows-[1fr_1fr] overflow-y-auto scroll-black">
                <section className="rounded-[10px] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl flex flex-col items-center justify-center min-h-[200px]">
                    <div className="flex items-center pb-1 w-full border-b border-white/10 mb-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/70">
                            Activity
                        </p>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Coming Soon</p>
                </section>
                <div className="rounded-[10px] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl flex flex-col items-center justify-center min-h-[200px]">
                    <div className="flex items-center justify-between pb-1 w-full border-b border-white/10 mb-4">
                        <p className="text-sm uppercase tracking-[0.15em] text-cyan-200/70">
                            Stats
                        </p>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Coming Soon</p>
                </div>
            </section>
        </div>
    )
}
