"use client";

import { Room, RoomEvent, Track, RemoteTrack } from "livekit-client";
import AboutCard from "./About";
import { useLiveStream } from "./Context/Home_context";
import TitleCard from "./TitleCard";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export function VideoFeed({ loading }: { loading: boolean }) {
  const {
    livestream,
    streams,
    selectedStreamId,
    setRoom,
    roomRef,
  } = useLiveStream();

  const selectedStream =
    streams.find((stream) => stream.id === selectedStreamId) ?? null;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!livestream) return;

    let cancelled = false;
    const room = new Room();

    const videoElement = videoRef.current;
    const audioElement = audioRef.current;

    // -----------------------------
    // Handle remote tracks
    // -----------------------------
    const handleTrackSubscribed = (track: RemoteTrack) => {
      console.log("🎵 Track subscribed:", track.kind);

      if (track.kind === Track.Kind.Video) {
        if (videoElement) {
          track.attach(videoElement);
          console.log("🎥 Video attached");
        }
      }

      if (track.kind === Track.Kind.Audio) {
        if (audioElement) {
          track.attach(audioElement);

          // Try to play immediately.
          audioElement
            .play()
            .then(() => {
              console.log("🔊 Audio playing");
            })
            .catch((error) => {
              console.warn(
                "🔇 Browser blocked autoplay:",
                error
              );
            });
        }
      }
    };

    const handleTrackUnsubscribed = (track: RemoteTrack) => {
      console.log("❌ Track unsubscribed:", track.kind);
      track.detach();
    };

    room.on(
      RoomEvent.TrackSubscribed,
      handleTrackSubscribed
    );

    room.on(
      RoomEvent.TrackUnsubscribed,
      handleTrackUnsubscribed
    );

    // -----------------------------
    // Connect
    // -----------------------------
    async function connectToStream() {
      const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;

      if (!url) {
        console.error(
          "❌ Missing NEXT_PUBLIC_LIVEKIT_URL"
        );
        return;
      }

      if (!livestream) {
        console.error(
          "❌ Missing livestream data"
        );
        return;
      }
      try {
        console.log("🔌 Connecting to LiveKit...");

        await room.connect(
          url,
          livestream.token
        );

        if (cancelled) {
          room.disconnect();
          return;
        }

        // Save room in context
        roomRef.current = room;
        setRoom(room);

        console.log(
          "✅ Viewer connected to:",
          livestream.roomName
        );

        console.log(
          "✅ Room saved to context:",
          room
        );

        // -----------------------------
        // Handle tracks that already exist
        // -----------------------------
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach(
            (publication) => {
              if (publication.track) {
                handleTrackSubscribed(
                  publication.track
                );
              }
            }
          );
        });
      } catch (error) {
        console.error(
          "❌ Failed to connect to livestream:",
          error
        );
      }
    }

    connectToStream();

    // -----------------------------
    // Cleanup
    // -----------------------------
    return () => {
      cancelled = true;

      room.off(
        RoomEvent.TrackSubscribed,
        handleTrackSubscribed
      );

      room.off(
        RoomEvent.TrackUnsubscribed,
        handleTrackUnsubscribed
      );

      room.disconnect();

      if (roomRef.current === room) {
        roomRef.current = null;
      }

      setRoom(null);
    };
  }, [livestream, selectedStreamId, roomRef, setRoom]);

  return (
    <section className="order-1 flex min-h-0 flex-1 flex-col rounded-[10px] border border-white/10 bg-white/6 shadow-2xl shadow-black/25 backdrop-blur-xl md:order-none md:h-full md:min-w-0">
      <div className="min-h-0 flex-1 overflow-y-auto scroll-black pr-1">
        <div className="space-y-3 md:space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-[10px] border border-white/10 bg-black p-2 sm:p-3 md:p-4">
            {/* Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={false}
              className="h-full w-full object-cover scale-x-[-1]"
            />

            {/* Audio */}
            <audio
              ref={audioRef}
              autoPlay
              playsInline
            />

            {/* Loading */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            )}
          </div>

          {!loading && (
            <>
              <TitleCard stream={selectedStream} />
              <AboutCard stream={selectedStream} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}