import type { LivestreamItem } from "@/types/livestream-types";

type TitleCardProps = {
  stream: LivestreamItem | null;
};

function fallbackText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "this message was not provided.";
}

function fallbackTags(tags: string[] | null | undefined) {
  return Array.isArray(tags) && tags.length > 0 ? tags : ["this message was not provided."];
}

export default function TitleCard({ stream }: TitleCardProps) {
  const ownerName = stream?.user
    ? `${stream.user.firstName ?? ""} ${stream.user.lastName ?? ""}`.trim()
    : "";
  const tags = fallbackTags(stream?.selectedTags);

  return (
    <article className="px-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col justify-center">
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {fallbackText(stream?.sessionName)}
          </h3>
          <span className="py-1 text-xs text-emerald-200">
            {ownerName || "this message was not provided."}
          </span>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300 sm:leading-7">
            {fallbackText(stream?.sessionDescription)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
