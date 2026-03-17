"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useEffectEvent, useState } from "react";

import { createCommentAction, initialActionState, saveCommentVoteAction } from "@/app/actions";
import type { DiscussionComment } from "@/lib/types";

interface DiscussionThreadProps {
  taskId: string;
  slug: string;
  comments: DiscussionComment[];
}

export function DiscussionThread({ taskId, slug, comments }: DiscussionThreadProps) {
  return (
    <div className="space-y-5">
      <CommentComposer taskId={taskId} slug={slug} label="Join the discussion" submitLabel="Post comment" />
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => <CommentCard key={comment.id} comment={comment} taskId={taskId} slug={slug} depth={0} />)
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-line bg-panel/65 p-6 text-sm leading-7 text-ink/66">
            No comments yet. The first useful comment should clarify tradeoffs, missing evidence, or safety boundaries.
          </div>
        )}
      </div>
    </div>
  );
}

function CommentCard({ comment, taskId, slug, depth }: { comment: DiscussionComment; taskId: string; slug: string; depth: number }) {
  const [replyOpen, setReplyOpen] = useState(false);

  return (
    <div className={`space-y-4 ${depth > 0 ? "ml-4 border-l border-line pl-4 sm:ml-6 sm:pl-6" : ""}`}>
      <article className="rounded-[1.45rem] border border-line bg-panel/88 p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-ink">{comment.profileName}</div>
            <div className="text-xs uppercase tracking-[0.18em] text-ink/45">
              {comment.profileRole} · stake {comment.stakeCredits}
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink/45">{new Date(comment.createdAt).toLocaleDateString("en-US")}</div>
        </div>
        <p className="mt-4 text-sm leading-7 text-ink/76">{comment.body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <CommentVoteButtons commentId={comment.id} slug={slug} score={comment.score} initialValue={comment.userVote} />
          <button
            type="button"
            onClick={() => setReplyOpen((value) => !value)}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
          >
            {replyOpen ? "Cancel reply" : "Reply"}
          </button>
        </div>
        {replyOpen ? <CommentComposer taskId={taskId} slug={slug} parentId={comment.id} label="Reply" submitLabel="Post reply" compact /> : null}
      </article>
      {comment.replies.map((reply) => (
        <CommentCard key={reply.id} comment={reply} taskId={taskId} slug={slug} depth={depth + 1} />
      ))}
    </div>
  );
}

function CommentVoteButtons({ commentId, slug, score, initialValue }: { commentId: string; slug: string; score: number; initialValue: number }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(saveCommentVoteAction, initialActionState);
  const syncRefresh = useEffectEvent(() => {
    if (state.status === "success") {
      router.refresh();
    }
  });

  useEffect(() => {
    syncRefresh();
  }, [state.status]);

  const scoreLabel = score > 0 ? `+${score}` : String(score);

  return (
    <form action={formAction} className="inline-flex items-center gap-2 rounded-full border border-line bg-page/70 px-3 py-2 text-sm">
      <input type="hidden" name="commentId" value={commentId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        name="value"
        value={initialValue === 1 ? 0 : 1}
        disabled={isPending}
        className={`font-semibold transition ${initialValue === 1 ? "text-accent" : "text-ink/72 hover:text-accent"}`}
      >
        ▲
      </button>
      <span className="min-w-8 text-center font-semibold text-ink">{scoreLabel}</span>
      <button
        type="submit"
        name="value"
        value={initialValue === -1 ? 0 : -1}
        disabled={isPending}
        className={`font-semibold transition ${initialValue === -1 ? "text-ember" : "text-ink/72 hover:text-ember"}`}
      >
        ▼
      </button>
    </form>
  );
}

function CommentComposer({
  taskId,
  slug,
  label,
  submitLabel,
  parentId,
  compact = false,
}: {
  taskId: string;
  slug: string;
  label: string;
  submitLabel: string;
  parentId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [state, formAction, isPending] = useActionState(createCommentAction, initialActionState);
  const syncRefresh = useEffectEvent(() => {
    if (state.status === "success") {
      setBody("");
      router.refresh();
    }
  });

  useEffect(() => {
    syncRefresh();
  }, [state.status]);

  return (
    <form action={formAction} className={`space-y-3 rounded-[1.4rem] border border-line ${compact ? "bg-page/50 p-4" : "bg-panel/82 p-5"}`}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <label className="space-y-2 text-xs uppercase tracking-[0.22em] text-ink/52">
        {label}
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={compact ? 3 : 4}
          placeholder="Add a concrete objection, refinement, or evidence request."
          className="min-h-28 w-full rounded-[1.1rem] border border-line bg-page/75 px-4 py-3 text-sm normal-case tracking-normal text-ink outline-none transition focus:border-accent"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-6 text-ink/52">Threaded discussion is separate from quadratic allocation. Use comments to refine quality, not to buy influence.</p>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-page transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Posting" : submitLabel}
        </button>
      </div>
      {state.message ? <p className={`text-xs ${state.status === "error" ? "text-red-700" : "text-accent"}`}>{state.message}</p> : null}
    </form>
  );
}
