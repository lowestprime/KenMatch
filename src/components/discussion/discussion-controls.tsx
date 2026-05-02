"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import {
  createDiscussionCommentAction,
  createDiscussionPostAction,
  discussionVoteAction,
  toggleSavedDiscussionAction,
} from "@/app/discuss/actions";

export function DiscussionPostForm({ signedIn }: { signedIn: boolean }) {
  const [state, action, pending] = useActionState(createDiscussionPostAction, initialActionState);
  if (!signedIn) {
    return <p className="alert">Sign in to open a discussion thread.</p>;
  }
  return (
    <form action={action} className="form-grid">
      <label className="field-label">Title<input className="field" name="title" placeholder="What should the KenMatch community decide or clarify?" />{state.fieldErrors?.title ? <small>{state.fieldErrors.title}</small> : null}</label>
      <label className="field-label">Topic<input className="field" name="topic" placeholder="prompt-design, governance, safety, funding, evidence..." />{state.fieldErrors?.topic ? <small>{state.fieldErrors.topic}</small> : null}</label>
      <label className="field-label">Body<textarea className="field" name="bodyMarkdown" rows={8} placeholder="Use markdown. Explain the context, evidence, alternatives, and what kind of answer or decision would help." />{state.fieldErrors?.bodyMarkdown ? <small>{state.fieldErrors.bodyMarkdown}</small> : null}</label>
      <div className="hero-actions"><button className="cta-primary" type="submit" disabled={pending}>{pending ? "Posting..." : "Post discussion"}</button>{state.message ? <span className={`micro-pill ${state.status === "error" ? "is-blocked" : ""}`}>{state.message}</span> : null}</div>
    </form>
  );
}

export function DiscussionCommentForm({ postId, slug, parentId, signedIn }: { postId: string; slug: string; parentId?: string; signedIn: boolean }) {
  const [state, action, pending] = useActionState(createDiscussionCommentAction, initialActionState);
  if (!signedIn) return <p className="alert">Sign in to comment.</p>;
  return (
    <form action={action} className="form-grid">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <label className="field-label">{parentId ? "Reply" : "Comment"}<textarea className="field" name="bodyMarkdown" rows={parentId ? 3 : 5} placeholder="Add evidence, a critique, an implementation detail, or a next step." />{state.fieldErrors?.bodyMarkdown ? <small>{state.fieldErrors.bodyMarkdown}</small> : null}</label>
      <div className="hero-actions"><button className="cta-secondary cta-compact" type="submit" disabled={pending}>{pending ? "Saving..." : parentId ? "Reply" : "Add comment"}</button>{state.message ? <span className="micro-pill">{state.message}</span> : null}</div>
    </form>
  );
}

export function DiscussionVoteButtons({ targetType, targetId, slug, userVote, score, signedIn }: { targetType: "post" | "comment"; targetId: string; slug: string; userVote: number; score: number; signedIn: boolean }) {
  const [, action, pending] = useActionState(discussionVoteAction, initialActionState);
  return (
    <div className="hero-actions discussion-votes" aria-label="Discussion vote controls">
      {[-1, 1].map((value) => (
        <form key={value} action={action}>
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="value" value={userVote === value ? 0 : value} />
          <button className={`vote-chip cta-compact ${userVote === value ? "is-active" : ""}`} disabled={!signedIn || pending} type="submit" aria-label={value > 0 ? "Upvote" : "Downvote"}>{value > 0 ? "▲" : "▼"}</button>
        </form>
      ))}
      <span className="micro-pill">{score} signal</span>
    </div>
  );
}

export function DiscussionSaveButton({ itemType, itemId, slug, saved, signedIn }: { itemType: "discussion_post" | "discussion_comment"; itemId: string; slug: string; saved: boolean; signedIn: boolean }) {
  const [state, action, pending] = useActionState(toggleSavedDiscussionAction, initialActionState);
  const isSaved = state.status === "success" ? state.message === "Saved." : saved;
  return (
    <form action={action}>
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="slug" value={slug} />
      <button className={`vote-chip cta-compact ${isSaved ? "is-active" : ""}`} disabled={!signedIn || pending} type="submit">{isSaved ? "★ Saved" : "☆ Save"}</button>
    </form>
  );
}
