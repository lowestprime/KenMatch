import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/avatar";
import { getProfileActivity } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { profile } = await getProfileActivity(id);
  if (!profile) return { title: "Profile not found" };
  return { title: profile.name, description: `${profile.role} · ${profile.specialty}` };
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile, proposedTasks, votes } = await getProfileActivity(id);
  if (!profile) notFound();

  return (
    <div className="page-stack">
      <section className="panel hero-panel card-sheen space-y-6">
        <div className="flex items-center gap-5">
          <Avatar name={profile.name} hue={profile.avatarHue} size={72} />
          <div>
            <div className="eyebrow">Contributor profile</div>
            <h1 className="font-display text-3xl font-semibold text-foreground">{profile.name}</h1>
            <p className="text-sm text-muted">{profile.role} · {profile.specialty}</p>
          </div>
        </div>
        <p className="text-sm leading-7 text-muted">{profile.bio}</p>
        <div className="metric-grid">
          <div className="metric-card"><div className="eyebrow">Attestation</div><div className="mt-2 text-sm font-semibold text-foreground capitalize">{profile.attestationLevel}</div></div>
          <div className="metric-card"><div className="eyebrow">Participation</div><div className="mt-2 text-sm font-semibold text-foreground">{profile.participationState === "full" ? "Full" : profile.participationState === "review-limited" ? "Review limited" : "Read only"}</div></div>
          <div className="metric-card"><div className="eyebrow">Voice credits</div><div className="metric-value">{profile.effectiveVoiceCredits}</div></div>
          <div className="metric-card"><div className="eyebrow">Free credits</div><div className="metric-value">{profile.availableCredits}</div></div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-muted">
          <span className="tag">{profile.attestationStatus}</span>
          <span className="tag">Sybil risk {profile.sybilRisk}</span>
          <span className="tag">Member since {formatDateTime(profile.createdAt)}</span>
        </div>
      </section>

      <section className="section-grid" data-columns="2">
        <div className="panel space-y-4">
          <div className="eyebrow">Proposed Kens</div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Projects {profile.name} submitted</h2>
          {proposedTasks.length > 0 ? proposedTasks.map((task) => (
            <Link key={task.id} href={`/kens/${task.slug}`} className="block rounded-[1.3rem] border border-border bg-background/55 p-4 transition hover:border-teal/30">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-foreground">{task.title}</div>
                <span className="tag">{task.stage}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-muted line-clamp-3">{task.summary}</p>
            </Link>
          )) : <p className="text-sm text-muted">No Kens proposed yet.</p>}
        </div>
        <div className="panel space-y-4">
          <div className="eyebrow">Voice allocation</div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Where {profile.name} spends priority</h2>
          {votes.length > 0 ? votes.map((vote) => (
            <div key={vote.id} className="rounded-[1.3rem] border border-border bg-background/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-foreground">{vote.taskTitle}</div>
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">{vote.voteCount} voice</span>
              </div>
              {vote.rationale ? <p className="mt-2 text-sm leading-7 text-muted">{vote.rationale}</p> : null}
            </div>
          )) : <p className="text-sm text-muted">No voice allocated yet.</p>}
        </div>
      </section>
    </div>
  );
}
