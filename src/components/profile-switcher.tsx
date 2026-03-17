"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setActiveProfileAction } from "@/app/actions";
import type { ProfileSummary } from "@/lib/types";

interface ProfileSwitcherProps {
  profiles: ProfileSummary[];
  activeProfileId: string;
}

export function ProfileSwitcher({ profiles, activeProfileId }: ProfileSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex min-w-[14rem] flex-col gap-2 text-xs uppercase tracking-[0.22em] text-ink/60">
      Active voter
      <select
        defaultValue={activeProfileId}
        className="rounded-full border border-line bg-page/74 px-4 py-3 text-sm font-medium normal-case tracking-normal text-ink outline-none transition focus:border-accent"
        disabled={isPending}
        onChange={(event) => {
          const nextId = event.target.value;
          startTransition(async () => {
            await setActiveProfileAction(nextId);
            router.refresh();
          });
        }}
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name} · {profile.availableCredits} credits free
          </option>
        ))}
      </select>
    </label>
  );
}
