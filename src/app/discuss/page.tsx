import Link from "next/link";

import { DiscussionPostForm, DiscussionSaveForm, DiscussionVoteForm } from "@/components/discussion-forms";
import { listDiscussionPosts } from "@/lib/discussion-db";
import { getViewerSession } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Discussion",
  description: "KenMatch discussion space for prompt design, governance, funding norms, safety review, and ecosystem debate.",
};

const topics = [
  ["all", "All"],
  ["prompt-design", "Prompt design"],
  ["governance", "Governance"],
  ["funding", "Funding"],
  ["safety", "Safety"],
  ["evidence", "Evidence"],
  ["meta", "Meta"],
] as const;

const sorts = [
  ["hot", "Hot"],
  ["new", "New"],
  ["comments", "Commented"],
  ["saved", "Saved"],
] as const;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function excerpt(body: string) {
  return body.length > 260 ? `${body.slice(0, 258).trim()}…` : body;
}

function queryHref(next: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value && value !== "all" && value !== "hot") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/discuss?${qs}` : "/discuss";
}

export default async function DiscussPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [viewer, params] = await Promise.all([getViewerSession(), searchParams ?? Promise.resolve({})]);
  const signedIn = Boolean(viewer);
  const topic = valueOf(params.topic) ?? "all";
  const sort = (valueOf(params.sort) ?? "hot") as "hot" | "new" | "comments" | "saved";
  const query = valueOf(params.q) ?? "";
  const posts = await listDiscussionPosts({ profileId: viewer?.profile.id, topic: topic === "all" ? undefined : topic, query, sort });

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <span className="eyebrow">Discussion commons</span>
        <h1>Discuss the system around Kens before scarce compute is assigned.</h1>
        <p style={{ color: "var(--ink-muted)", maxWidth: "58rem" }}>
          The Feed is for executable Kens. Discussion is the persistent public workspace for proposal refinement, prompt design, governance questions, funding norms, safety concerns, and reusable evidence that should not be buried inside one Ken thread.
        </p>
        <div className="hero-actions">
          <Link className="cta-primary" href="/submit">Turn an idea into a Ken</Link>
          <Link className="cta-secondary" href="/faq#discussion-tab">Read how Discussion fits</Link>
          <Link className="cta-secondary" href="/kens">Return to the Feed</Link>
        </div>
      </section>

      <section className="discussion-layout">
        <div className="grid gap-3">
          <section className="panel grid gap-3">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Forum</span>
                <h2>Posts, votes, saves, and nested comments</h2>
              </div>
              <span className="micro-pill">{posts.length} threads</span>
            </div>
            <form action="/discuss" className="form-grid form-grid-two">
              <label className="field-label">
                <span>Search</span>
                <input className="field" name="q" defaultValue={query} placeholder="Search discussions…" />
              </label>
              <label className="field-label">
                <span>Topic</span>
                <select className="field" name="topic" defaultValue={topic}>
                  {topics.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <button className="cta-secondary cta-compact" type="submit">Filter</button>
            </form>
            <div className="hero-actions">
              {topics.map(([value, label]) => (
                <Link key={value} className={`filter-chip ${topic === value ? "is-active" : ""}`} href={queryHref({ topic: value, sort, q: query })}>{label}</Link>
              ))}
            </div>
            <div className="hero-actions">
              {sorts.map(([value, label]) => (
                <Link key={value} className={`filter-chip ${sort === value ? "is-active" : ""}`} href={queryHref({ topic, sort: value, q: query })}>{label}</Link>
              ))}
            </div>
          </section>

          <section className="discussion-post-list">
            {posts.length === 0 ? (
              <article className="panel grid gap-2">
                <h2>No discussion posts match this view yet.</h2>
                <p style={{ color: "var(--muted)" }}>Start a thread to refine a Ken brief, governance norm, safety concern, or evidence source.</p>
              </article>
            ) : posts.map((post) => (
              <article key={post.id} className="discussion-post-card interactive-surface">
                <div className="discussion-vote-stack">
                  <DiscussionVoteForm targetType="post" targetId={post.id} slug={post.slug} value={1} active={post.userVote > 0} signedIn={signedIn} />
                  <div className="discussion-score">{post.score}</div>
                  <DiscussionVoteForm targetType="post" targetId={post.id} slug={post.slug} value={-1} active={post.userVote < 0} signedIn={signedIn} />
                </div>
                <div className="discussion-post-body">
                  <div className="discussion-meta">
                    <span className="discussion-topic">{post.topic}</span>
                    <span>by {post.profileUsername ? `@${post.profileUsername}` : post.profileName}</span>
                    <span>{formatDateTime(post.createdAt)}</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                  <h2 className="discussion-post-title"><Link href={`/discuss/${post.slug}`}>{post.title}</Link></h2>
                  <p className="discussion-copy">{excerpt(post.bodyMarkdown)}</p>
                  <div className="discussion-actions">
                    <Link className="cta-secondary cta-compact" href={`/discuss/${post.slug}`}>Open thread</Link>
                    <DiscussionSaveForm itemType="discussion_post" itemId={post.id} slug={post.slug} saved={post.saved} signedIn={signedIn} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>

        <aside className="grid gap-3">
          <section className="panel grid gap-3">
            <span className="eyebrow">Start a thread</span>
            {viewer ? (
              <DiscussionPostForm />
            ) : (
              <div className="grid gap-2">
                <p style={{ color: "var(--muted)" }}>Sign in to post, vote, comment, and save discussions.</p>
                <Link className="cta-primary" href="/auth">Sign in</Link>
              </div>
            )}
          </section>
          <section className="panel grid gap-3">
            <span className="eyebrow">How it feeds Kens</span>
            <ol className="criteria-list">
              <li>Use discussion while the problem, category, risk, or evidence base is still ambiguous.</li>
              <li>Narrow desired outputs, source requirements, red lines, and checkpoint cadence.</li>
              <li>Move mature briefs into Submit once they can be ranked, funded, monitored, and audited.</li>
            </ol>
          </section>
        </aside>
      </section>
    </div>
  );
}
