import type { ActivityFeedItem } from "@/components/stream/utils/use-activity-feed";

type ActivityFeedPanelProps = {
  items: ActivityFeedItem[];
  isLive: boolean;
};

/** Realtime streamer activity (follows, viewers joining/leaving, stream state) via SSE. */
export function ActivityFeedPanel({ items, isLive }: ActivityFeedPanelProps) {
  if (!isLive) {
    return <p className="text-slate-400 text-sm font-medium">Go live to see realtime activity.</p>;
  }

  if (items.length === 0) {
    return <p className="text-slate-400 text-sm font-medium">No activity yet.</p>;
  }

  return (
    <ul className="flex w-full flex-col gap-2 overflow-y-auto scroll-black">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-200"
        >
          {item.text}
        </li>
      ))}
    </ul>
  );
}
