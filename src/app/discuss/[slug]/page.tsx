import Link from "next/link";
import { notFound } from "next/navigation";

import { DiscussionCommentForm, DiscussionSaveForm, DiscussionVoteForm } from "@/components/discussion-forms";
import { getDiscussionPost } from "@/lib/discussion-db";
import { getViewerSession } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";
import type { DiscussionCommentSummary } from "@/lib/discussion-db";

export const metadata = { title: "Discussion thread" };

function CommentTree({ comments, slug, viewerSignedIn }: { comments: DiscussionCommentSummary[]; slug: string; viewerSignedIn: boolean }) {
  if (comments.length === 0) return <p style={{ color: "var(--muted)" }}>No comments yet. Add the first concrete refinement, objection, source, or decision criterion.</p>;
  return (
    <div className="discussion-comment-list">
      {comments.map((comment) => (
        <article key={comment.id} id={`comment-${comment.id}`} className="discussion-comment">
          <div className="discussion-meta">
            <span>{comment.profileUsername ? `@${comment.profileUsername}` : comment.profileName}</span>
            <span>{formatDateTime(comment.createdAt)}</span>
          </div>
          <p className="discussion-copy">{comment.bodyMarkdown}</p>
          <div className="discussion-actions">
            <DiscussionVoteForm targetType="comment" targetId={comment.id} slug={slug} value={1} active={comment.userVote > 0} signedIn={viewerSignedIn} />
            <span className="discussion-score">{comment.score}</span>
            <DiscussionVoteForm targetType="comment" targetId={comment.id} slug={slug} value={-1} active={comment.userVote < 0} signedIn={viewerSignedIn} />
            <DiscussionSaveForm itemType="discussion_comment" itemId={comment.id} slug={slug} saved={comment.saved} signedIn={viewerSignedIn} />
          </div>
          {viewerSignedIn ? <div style={{ marginTop: ".75rem" }}><DiscussionCommentForm postId={comment.postId} slug={slug} parentId={comment.id} /></div> : null}
          {comment.replies.length > 0 ? <div className="discussion-comment-replies"><CommentTree comments={comment.replies} slug={slug} viewerSignedIn={viewerSignedIn} /></div> : null}
        </article>
      ))}
    </div>
  );
}

export default async function DiscussionThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, viewer] = await Promise.all([params, getViewerSession()]);
  const viewerSignedIn = Boolean(viewer);
  const post = await getDiscussionPost(slug, viewer?.profile.id);
  if (!post) notFound();

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <span className="eyebrow">Discussion · {post.topic}</span>
        <h1>{post.title}</h1>
        <div className="discussion-meta">
          <span>by {post.profileUsername ? `@${post.profileUsername}` : post.profileName}</span>
          <span>{formatDateTime(post.createdAt)}</span>
          <span>{post.commentCount} comments</span>
          <span>{post.score} score</span>
        </div>
        <p className="discussion-copy" style={{ maxWidth: "64rem" }}>{post.bodyMarkdown}</p>
        <div className="discussion-actions">
          <DiscussionVoteForm targetType="post" targetId={post.id} slug={post.slug} value={1} active={post.userVote > 0} signedIn={viewerSignedIn} />
          <span className="discussion-score">{post.score}</span>
          <DiscussionVoteForm targetType="post" targetId={post.id} slug={post.slug} value={-1} active={post.userVote < 0} signedIn={viewerSignedIn} />
          <DiscussionSaveForm itemType="discussion_post" itemId={post.id} slug={post.slug} saved={post.saved} signedIn={viewerSignedIn} />
          <Link className="cta-secondary cta-compact" href="/discuss">Back to Discussion</Link>
        </div>
      </section>

      <section className="discussion-layout">
        <div className="grid gap-3">
          <section className="panel grid gap-3">
            <div className="section-heading"><div><span className="eyebrow">Thread</span><h2>Comments and replies</h2></div></div>
            <CommentTree comments={post.comments} slug={post.slug} viewerSignedIn={viewerSignedIn} />
          </section>
        </div>
        <aside className="grid gap-3">
          <section className="panel grid gap-3">
            <span className="eyebrow">Add a comment</span>
            {viewer ? <DiscussionCommentForm postId={post.id} slug={post.slug} /> : <div className="grid gap-2"><p style={{ color: "var(--muted)" }}>Sign in to comment, vote, and save this thread.</p><Link className="cta-primary" href="/auth">Sign in</Link></div>}
          </section>
          <section className="panel grid gap-3">
            <span className="eyebrow">Purpose</span>
            <p style={{ color: "var(--muted)" }}>Discussion threads are for shaping reusable prompts, policy, evidence, and critique before a bounded Ken consumes scarce compute.</p>
            <Link className="cta-secondary cta-compact" href="/submit">Submit a mature Ken</Link>
          </section>
        </aside>
      </section>
    </div>
  );
}
