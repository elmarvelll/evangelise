"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Loader2, MessageSquareText, SendHorizontal } from "lucide-react";
import { useLiveStream } from "./Context/Home_context";
import { useCommentListener } from "./utils/comment_Setup";
import { useSendComment } from "./utils/comment_send";

export type Comment = {
  id: string;
  name: string;
  time: string;
  text: string;
};

export function CommentsRail({ loading }: { loading: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  useCommentListener();
  const { selectedStreamId, comments } = useLiveStream();
  const { commentText, handleSubmit, setText } = useSendComment(selectedStreamId);

  // Comment history is already loaded (and kept in sync with the selected
  // stream) by LiveStreamProvider's own effect in Home_context.tsx. This
  // component used to duplicate that fetch here, but expected the response
  // shaped as `{ comments: [...] }` while the API actually returns a bare
  // array — so `data.comments` was always `undefined` and this effect
  // clobbered the correctly-loaded history with an empty array on every
  // stream switch. Removed rather than fixed in place, since keeping two
  // independent fetches of the same data racing each other isn't the fix.

  return (
    <motion.aside
      layout
      className={[
        "order-3 flex h-64 min-h-0 flex-col overflow-hidden rounded-[10px] border border-white/10 bg-white/6 p-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:h-72 sm:p-4 md:order-none md:h-full md:shrink-0",
        "w-full md:w-[var(--comments-width)]",
      ].join(" ")}
      style={
        {
          ["--comments-width" as never]: collapsed ? "72px" : "340px",
        } as CSSProperties
      }
      transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 sm:mb-4 sm:pb-3">
        <div className="flex min-w-0 items-center gap-3">
          {!collapsed && <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100 sm:h-10 sm:w-10">
            <MessageSquareText size={18} />
          </div>}
          <AnimatePresence initial={false} mode="wait">
            {!collapsed && (
              <motion.div
                key="comments-title"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Comments</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-full border border-white/10 bg-slate-950/70 p-2 text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
          aria-label={collapsed ? "Expand comments" : "Collapse comments"}
          whileTap={{ scale: 0.96 }}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="block"
          >
            <ChevronRight size={18} />
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {!collapsed ? (
          <>
            <motion.div
              key="comments-open"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={{ duration: 0.25 }}
              className="min-h-0 flex-1 overflow-y-auto scroll-black pr-1"
            >
              <div className="space-y-1">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id || `${comment.name}-${comment.time}-${comment.text}`}
                      className="rounded-2xl px-2 py-1 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          <span className="text-xs font-normal text-white/60 pr-1">{comment.time}</span>
                          <span>{comment.name}</span> : {comment.text}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
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
                  type="submit"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-400/15 text-cyan-100 transition hover:bg-cyan-400/25"
                  aria-label="Send comment"
                >
                  <SendHorizontal size={16} />
                </button>
              </div>
            </motion.form>
          </>
        ) : (
          <motion.div
            key="comments-closed"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 items-start justify-center pt-4"
          >
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
