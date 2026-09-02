"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { christianTags, StreamSetupValues } from "@/components/stream/utils/types";
import { SessionCard } from "@/components/stream/session-card";
import { TagsDropdown } from "@/components/stream/tags-dropdown";
import { InteractionsCard } from "@/components/stream/interactions-card";
import {
  isStreamSetupComplete,
  readStreamSetupDraft,
  writeStreamSetupDraft,
} from "@/components/stream/utils/stream-session-storage";

const maxTags = 3;

const initialValues: StreamSetupValues = {
  sessionName: "",
  sessionDescription: "",
  selectedTags: [],
  interactionsEnabled: true,
};

export function StreamSetupForm() {
  const router = useRouter();
  const [values, setValues] = useState<StreamSetupValues>(() => {
    const draft = readStreamSetupDraft();

    if (!draft) {
      return initialValues;
    }

    return {
      ...initialValues,
      sessionName: typeof draft.sessionName === "string" ? draft.sessionName : "",
      sessionDescription:
        typeof draft.sessionDescription === "string" ? draft.sessionDescription : "",
      selectedTags: Array.isArray(draft.selectedTags) ? draft.selectedTags : [],
      interactionsEnabled:
        typeof draft.interactionsEnabled === "boolean" ? draft.interactionsEnabled : true,
    };
  });
  const [tagsOpen, setTagsOpen] = useState(false);

  useEffect(() => {
    writeStreamSetupDraft(values);
  }, [values]);

  const updateSelectedTags = (tag: string) => {
    setValues((current) => {
      if (current.selectedTags.includes(tag)) {
        return {
          ...current,
          selectedTags: current.selectedTags.filter((item) => item !== tag),
        };
      }

      if (current.selectedTags.length >= maxTags) {
        return current;
      }

      return {
        ...current,
        selectedTags: [...current.selectedTags, tag],
      };
    });
  };

  const canGoToDashboard = isStreamSetupComplete(values);

  const handleGoToDashboard = () => {
    if (!canGoToDashboard) {
      return;
    }

    router.push("/stream/dashboard");
  };

  return (
    <div className="space-y-5">
      <SessionCard
        sessionName={values.sessionName}
        sessionDescription={values.sessionDescription}
        onSessionNameChange={(sessionName) =>
          setValues((current) => ({ ...current, sessionName }))
        }
        onSessionDescriptionChange={(sessionDescription) =>
          setValues((current) => ({ ...current, sessionDescription }))
        }
      />

      <TagsDropdown
        availableTags={christianTags}
        selectedTags={values.selectedTags}
        isOpen={tagsOpen}
        maxTags={maxTags}
        onToggleOpen={() => setTagsOpen((current) => !current)}
        onSelectTag={updateSelectedTags}
        onRemoveTag={updateSelectedTags}
      />

      <InteractionsCard
        enabled={values.interactionsEnabled}
        onToggle={(interactionsEnabled) =>
          setValues((current) => ({ ...current, interactionsEnabled }))
        }
      />

      <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-200/70">Ready to go</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Review and open the dashboard</h2>
            <p className="mt-2 text-sm text-slate-400">
              Fill in the required setup fields, then continue to the streamer dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoToDashboard}
            disabled={!canGoToDashboard}
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 disabled:hover:bg-slate-700"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
