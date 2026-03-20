"use client";

import { useActionState, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { createCommentAction, saveCommentVoteAction } from "@/app/actions";
import type { DiscussionComment } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function DiscussionThread({
  taskId,
  slug,
  comments,
  disabled,
  disabledMessage,
}: {
  taskId: string;
  slug: string;
  comments: DiscussionComment[];
  disabled?: boolean;
  disabledMessage?: string;
}) {
  return (
    <div className="panel space-y-6">
      <div>
        <div className="eyebrow">Comments</div>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Public notes, critiques, and replies</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Keep comments specific. The most useful notes clarify scope, challenge assumptions, or improve the audit trail for a Ken.
        </p>
      </div>
      <CommentComposer taskId={taskId} slug={slug} disabled={disabled} disabledMessage={disabledMessage} />
      <div className="space-y-4">
        {comments.length > 0 ? comments.map((comment) => <CommentNode key={comment.id} comment={comment} slug={slug} disabled={disabled} disabledMessage={disabledMessage} />) : <p className="text-sm text-muted">No public comments yet.</p>}
      </div>
    </div>
  );
}

function CommentComposer({
  taskId,
  slug,
  parentId,
  disabled,
  disabledMessage,
}: {
  taskId: string;
  slug: string;
  parentId?: string;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [state, action, isPending] = useActionState(createCommentAction, initialActionState);
  return (
    <form action={action} className="grid gap-3 rounded-[1.35rem] border border-border bg-panel/80 p-4">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <textarea
        name="body"
        rows={parentId ? 3 : 4}
        className="field"
        placeholder={parentId ? "Add a reply with a concrete correction, concern, or improvement." : "Add a public note about scope, value, risks, or delivery quality."}
        disabled={disabled || isPending}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs uppercase tracking-[0.22em] text-muted">
          Stake
          <select name="stakeCredits" className="field mt-2 max-w-28" defaultValue="1" disabled={disabled || isPending}>
            <option value="1">1 credit</option>
            <option value="2">2 credits</option>
            <option value="3">3 credits</option>
          </select>
        </label>
        <button type="submit" className="cta-secondary" disabled={disabled || isPending}>
          {isPending ? "Posting" : parentId ? "Reply" : "Post comment"}
        </button>
      </div>
      {disabled ? <p className="text-sm text-muted">{disabledMessage ?? "Sign in to comment on this Ken."}</p> : null}
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
    </form>
  );
}

function CommentNode({
  comment,
  slug,
  disabled,
  disabledMessage,
}: {
  comment: DiscussionComment;
  slug: string;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [replying, setReplying] = useState(false);
  const [state, action, isPending] = useActionState(saveCommentVoteAction, initialActionState);

  return (
    <article className="rounded-[1.5rem] border border-border bg-panel/72 p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-foreground">{comment.profileName}</div>
          <div className="text-sm text-muted">{comment.profileRole}</div>
        </div>
        <div className="comment-meta-stack">
          <span className="tag">Stake {comment.stakeCredits}</span>
          <span className="text-xs uppercase tracking-[0.22em] text-muted">{formatDateTime(comment.createdAt)}</span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted">{comment.body}</p>
      <form action={action} className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <input type="hidden" name="commentId" value={comment.id} />
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" name="value" value={String(comment.userVote === 1 ? 0 : 1)} className={`vote-chip ${comment.userVote === 1 ? "is-active" : ""}`} disabled={disabled || isPending}>
          Up {comment.upvotes}
        </button>
        <button type="submit" name="value" value={String(comment.userVote === -1 ? 0 : -1)} className={`vote-chip ${comment.userVote === -1 ? "is-active" : ""}`} disabled={disabled || isPending}>
          Down {comment.downvotes}
        </button>
        <span className="text-muted">Score {comment.score}</span>
        <button type="button" className="text-teal" onClick={() => setReplying((value) => !value)} disabled={disabled}>
          {replying ? "Cancel" : "Reply"}
        </button>
      </form>
      {disabled && !replying ? <p className="mt-2 text-sm text-muted">{disabledMessage ?? "Sign in to interact with comments."}</p> : null}
      {state.message ? <p className={`mt-2 text-sm ${state.status === "error" ? "text-red-500" : "text-teal"}`}>{state.message}</p> : null}
      {replying ? <div className="mt-4"><CommentComposer taskId={comment.taskId} slug={slug} parentId={comment.id} disabled={disabled} disabledMessage={disabledMessage} /></div> : null}
      {comment.replies.length > 0 ? (
        <div className="mt-4 space-y-4 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} slug={slug} disabled={disabled} disabledMessage={disabledMessage} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

