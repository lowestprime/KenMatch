"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { signOutClientAction } from "@/app/actions";

export function SignOutButton({
  className = "cta-secondary cta-compact",
  onSignedOut,
}: {
  className?: string;
  onSignedOut?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const busy = pending || isRefreshing;

  async function handleSignOut() {
    if (busy) return;
    setPending(true);
    try {
      await signOutClientAction();
      window.dispatchEvent(new CustomEvent("kenmatch:auth-changed", { detail: { signedIn: false } }));
      onSignedOut?.();
      startTransition(() => {
        router.replace("/");
        router.refresh();
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleSignOut} disabled={busy} aria-busy={busy}>
      {busy ? "Signing out" : "Sign out"}
    </button>
  );
}
