"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { toggleKenBookmarkAction } from "@/app/bookmark-actions";

export function KenBookmarkButton({
  taskId,
  slug,
  saved,
  signedIn,
  compact = false,
}: {
  taskId: string;
  slug: string;
  saved: boolean;
  signedIn: boolean;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(toggleKenBookmarkAction, initialActionState);
  const isSaved = state.status === "success" ? state.message === "Ken saved." : saved;
  return (
    <form action={action} className="discussion-inline-form">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        className={`discussion-save-button ${compact ? "cta-compact" : ""}`}
        type="submit"
        aria-pressed={isSaved}
        disabled={!signedIn || pending}
        title={signedIn ? (isSaved ? "Remove Ken from saved items" : "Save Ken") : "Sign in to save Kens"}
      >
        {isSaved ? "★ Saved" : "☆ Save"}
      </button>
    </form>
  );
}
