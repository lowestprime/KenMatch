"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { initialActionState } from "@/app/action-state";
import { createCommentAction, saveCommentVoteAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import type { DiscussionComment } from "@/lib/types";
import { describeRelativeTime, formatDateTime } from "@/lib/utils";

type SortMode = "top" | "new" | "controversial";

function sortComments(comments: DiscussionComment[], mode: SortMode): DiscussionComment[] {
  const sorted = [...comments];
  if (mode === "top") {
    sorted.sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (mode === "new") {
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    sorted.sort((a, b) => b.upvotes + b.downvotes - (a.upvotes + a.downvotes));
  }
  return sorted.map((comment) => ({ ...comment, replies: sortComments(comment.replies, mode) }));
}

function countAllComments(comments: DiscussionComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countAllComments(comment.replies), 0);
}

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
  const [sort, setSort] = useState<SortMode>("top");
  const sorted = useMemo(() => sortComments(comments, sort), [comments, sort]);
  const totalCount = useMemo(() => countAllComments(comments), [comments]);

  return (
    <div className="panel grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">Discussion</span>
          <h2>{totalCount} comment{totalCount === 1 ? "" : "s"}</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.25rem" }}>
            Keep comments specific and plainspoken. The strongest posts add a correction, use case, missing risk, or better success bar.
          </p>
        </div>
        <div className="auth-switcher">
          {(["top", "new", "controversial"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={mode === sort ? "is-active" : ""}
              onClick={() => setSort(mode)}
            >
              {mode[0].toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <CommentComposer taskId={taskId} slug={slug} disabled={disabled} disabledMessage={disabledMessage} />
      <div className="comment-tree">
        {sorted.length > 0 ? (
          sorted.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              slug={slug}
              disabled={disabled}
              disabledMessage={disabledMessage}
              depth={0}
            />
          ))
        ) : (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No public comments yet. Start the conversation.
          </p>
        )}
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
  onSuccess,
}: {
  taskId: string;
  slug: string;
  parentId?: string;
  disabled?: boolean;
  disabledMessage?: string;
  onSuccess?: () => void;
}) {
  const [state, action, isPending] = useActionState(createCommentAction, initialActionState);
  if (state.status === "success" && onSuccess) {
    queueMicrotask(onSuccess);
  }
  return (
    <form action={action} className="form-grid" style={{ background: "color-mix(in srgb, var(--panel-strong) 60%, transparent)", padding: "0.9rem", borderRadius: "1.1rem", border: "1px solid var(--line)" }}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <textarea
        name="body"
        rows={parentId ? 3 : 4}
        className="field"
        placeholder={
          parentId
            ? "Add a reply with a concrete correction, concern, or improvement."
            : "Add a comment about what makes this useful, risky, confusing, or worth backing."
        }
        disabled={disabled || isPending}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="field-label" style={{ width: "auto", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
          <span>Stake</span>
          <select name="stakeCredits" className="field" defaultValue="1" disabled={disabled || isPending} style={{ width: "auto" }}>
            <option value="1">1 credit</option>
            <option value="2">2 credits</option>
            <option value="3">3 credits</option>
          </select>
        </label>
        <button type="submit" className="cta-primary cta-compact" disabled={disabled || isPending}>
          {isPending ? "Posting…" : parentId ? "Post reply" : "Post comment"}
        </button>
      </div>
      {disabled ? <p className="text-sm" style={{ color: "var(--muted)" }}>{disabledMessage ?? "Sign in to comment on this Ken."}</p> : null}
      {state.message ? (
        <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}

function CommentNode({
  comment,
  slug,
  disabled,
  disabledMessage,
  depth,
}: {
  comment: DiscussionComment;
  slug: string;
  disabled?: boolean;
  disabledMessage?: string;
  depth: number;
}) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [voteState, voteAction, votePending] = useActionState(saveCommentVoteAction, initialActionState);
  const systemRole = comment.profileSystemRole ?? "contributor";
  const badgeClass =
    systemRole === "owner"
      ? "comment-author-badge is-owner"
      : systemRole === "admin"
        ? "comment-author-badge is-admin"
        : systemRole === "moderator"
          ? "comment-author-badge is-moderator"
          : null;

  return (
    <article className={`comment-card${collapsed ? " is-collapsed" : ""}`}>
      <form action={voteAction} className="comment-shell">
        <input type="hidden" name="commentId" value={comment.id} />
        <input type="hidden" name="slug" value={slug} />
        <div className="comment-vote-rail">
          <button
            type="submit"
            name="value"
            value={String(comment.userVote === 1 ? 0 : 1)}
            className={`comment-vote-button ${comment.userVote === 1 ? "is-active" : ""}`}
            disabled={disabled || votePending}
            aria-label={comment.userVote === 1 ? "Remove upvote" : "Upvote comment"}
            title="Upvote"
          >
            ▲
          </button>
          <span className="comment-score">{comment.score}</span>
          <button
            type="submit"
            name="value"
            value={String(comment.userVote === -1 ? 0 : -1)}
            className={`comment-vote-button ${comment.userVote === -1 ? "is-active" : ""}`}
            disabled={disabled || votePending}
            aria-label={comment.userVote === -1 ? "Remove downvote" : "Downvote comment"}
            title="Downvote"
          >
            ▼
          </button>
        </div>
        <div className="comment-content">
          <header className="comment-topline">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                setCollapsed((value) => !value);
              }}
              className="comment-collapse-button"
              aria-expanded={!collapsed}
              title={collapsed ? "Expand thread" : "Collapse thread"}
            >
              {collapsed ? "[+]" : "[−]"}
            </button>
            <Avatar
              profile={{
                name: comment.profileName,
                hue: comment.avatarHue,
                avatarImage: comment.avatarImage,
                avatarGradient: comment.avatarGradient,
                avatarImageScale: comment.avatarImageScale,
                avatarImageX: comment.avatarImageX,
                avatarImageY: comment.avatarImageY,
              }}
              size={26}
            />
            <Link href={`/people/${comment.profileId}`} className="comment-author">
              {comment.profileName}
            </Link>
            {badgeClass ? <span className={badgeClass}>{systemRole}</span> : null}
            <span>· {comment.profileRole}</span>
            <span>· {describeRelativeTime(comment.createdAt)}</span>
            <span title={formatDateTime(comment.createdAt)} className="text-xs">
              · {formatDateTime(comment.createdAt)}
            </span>
          </header>
          {!collapsed ? (
            <>
              <p className="mt-2" style={{ color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                {comment.body}
              </p>
              <div className="comment-toolbar">
                <span className="tag">Stake {comment.stakeCredits}</span>
                <span>▲ {comment.upvotes}</span>
                <span>▼ {comment.downvotes}</span>
                <button
                  type="button"
                  className="comment-reply-link"
                  onClick={(event) => {
                    event.preventDefault();
                    setReplying((value) => !value);
                  }}
                  disabled={disabled}
                >
                  {replying ? "Cancel" : "Reply"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </form>
      {!collapsed && voteState.message ? (
        <p className={`alert ${voteState.status === "error" ? "alert-error" : "alert-success"} mt-2`}>{voteState.message}</p>
      ) : null}
      {!collapsed && replying ? (
        <div style={{ marginTop: "0.7rem" }}>
          <CommentComposer
            taskId={comment.taskId}
            slug={slug}
            parentId={comment.id}
            disabled={disabled}
            disabledMessage={disabledMessage}
            onSuccess={() => setReplying(false)}
          />
        </div>
      ) : null}
      {!collapsed && comment.replies.length > 0 ? (
        <div className={`comment-replies is-depth-${Math.min(4, depth + 1)}`}>
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              slug={slug}
              disabled={disabled}
              disabledMessage={disabledMessage}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
