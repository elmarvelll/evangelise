"use client";

import { useFollow } from "@/components/home/utils/use-follow";

type FollowButtonProps = {
  streamerId: string | null;
};

export function FollowButton({ streamerId }: FollowButtonProps) {
  const { isFollowing, followerCount, canFollow, loading, toggleFollow } = useFollow(streamerId);

  if (!streamerId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={!canFollow || loading}
        title={canFollow ? undefined : "Sign in to follow"}
        className={[
          "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-60",
          isFollowing
            ? "border-white/10 bg-white/5 text-slate-300 hover:border-rose-400/30 hover:text-rose-200"
            : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
        ].join(" ")}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
      <span className="text-xs text-slate-400">
        {followerCount} {followerCount === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}
