"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import { toggleBookmarkAction } from "@/app/actions";

export function BookmarkButton({ taskId, bookmarked, disabled }: { taskId: string; bookmarked: boolean; disabled?: boolean }) {
  const [state, action, isPending] = useActionState(toggleBookmarkAction, initialActionState);
  const isBookmarked = state.status === "success" ? state.message === "Bookmarked." : bookmarked;

  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={taskId} />
      <button
        type="submit"
        className={`vote-chip ${isBookmarked ? "is-active" : ""}`}
        disabled={disabled || isPending}
        aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this Ken"}
        title={isBookmarked ? "Remove bookmark" : "Bookmark"}
      >
        {isBookmarked ? "★ Saved" : "☆ Save"}
      </button>
    </form>
  );
}
