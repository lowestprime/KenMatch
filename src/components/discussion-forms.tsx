"use client";

import { useActionState } from "react";

import { initialActionState } from "@/app/action-state";
import {
  createDiscussionCommentAction,
  createDiscussionPostAction,
  discussionVoteAction,
  toggleSavedDiscussionAction,
} from "@/app/discuss/actions";

export function DiscussionPostForm() {
  const [state, action, pending] = useActionState(createDiscussionPostAction, initialActionState);
  return (
    <form action={action} className="discussion-form">
      <label className="field-label">
        <span>Title</span>
        <input className="field" name="title" minLength={10} maxLength={160} required placeholder="What should the KenMatch community decide or improve?" />
      </label>
      <label className="field-label">
        <span>Topic</span>
        <select className="field" name="topic" defaultValue="prompt-design">
          <option value="prompt-design">Prompt design</option>
          <option value="governance">Governance</option>
          <option value="funding">Funding</option>
          <option value="safety">Safety</option>
          <option value="evidence">Evidence</option>
          <option value="meta">Meta</option>
        </select>
      </label>
      <label className="field-label">
        <span>Body</span>
        <textarea className="field" name="bodyMarkdown" minLength={40} maxLength={8000} required rows={7} placeholder="Describe the question, evidence, risks, proposed norm, or prompt-design issue. Markdown is fine." />
      </label>
      <button className="cta-primary" type="submit" disabled={pending}>{pending ? "Posting…" : "Start discussion"}</button>
      {state.message ? <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p> : null}
    </form>
  );
}

export function DiscussionCommentForm({ postId, slug, parentId }: { postId: string; slug: string; parentId?: string | null }) {
  const [state, action, pending] = useActionState(createDiscussionCommentAction, initialActionState);
  return (
    <form action={action} className="discussion-form">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
      <label className="field-label">
        <span>{parentId ? "Reply" : "Comment"}</span>
        <textarea className="field" name="bodyMarkdown" minLength={12} maxLength={4000} required rows={parentId ? 3 : 5} placeholder="Add evidence, an objection, a design improvement, or a concrete next step." />
      </label>
      <button className="cta-secondary cta-compact" type="submit" disabled={pending}>{pending ? "Saving…" : parentId ? "Reply" : "Add comment"}</button>
      {state.message ? <p className={`alert ${state.status === "error" ? "alert-error" : "alert-success"}`}>{state.message}</p> : null}
    </form>
  );
}

export function DiscussionVoteForm({
  targetType,
  targetId,
  slug,
  value,
  active,
  signedIn = true,
}: {
  targetType: "post" | "comment";
  targetId: string;
  slug: string;
  value: -1 | 0 | 1;
  active: boolean;
  signedIn?: boolean;
}) {
  const [, action, pending] = useActionState(discussionVoteAction, initialActionState);
  return (
    <form action={action} className="discussion-inline-form">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="value" value={active ? 0 : value} />
      <button
        className="discussion-vote-button"
        type="submit"
        aria-pressed={active}
        disabled={!signedIn || pending}
        title={signedIn ? (value > 0 ? "Upvote" : "Downvote") : "Sign in to vote"}
      >
        {value > 0 ? "▲" : "▼"}
      </button>
    </form>
  );
}

export function DiscussionSaveForm({
  itemType,
  itemId,
  slug,
  saved,
  signedIn = true,
}: {
  itemType: "discussion_post" | "discussion_comment";
  itemId: string;
  slug: string;
  saved: boolean;
  signedIn?: boolean;
}) {
  const [, action, pending] = useActionState(toggleSavedDiscussionAction, initialActionState);
  return (
    <form action={action} className="discussion-inline-form">
      <input type="hidden" name="itemType" value={itemType} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        className="discussion-save-button"
        type="submit"
        aria-pressed={saved}
        disabled={!signedIn || pending}
        title={signedIn ? (saved ? "Remove from saved discussion" : "Save discussion item") : "Sign in to save discussion items"}
      >
        {saved ? "Saved" : "Save"}
      </button>
    </form>
  );
}
