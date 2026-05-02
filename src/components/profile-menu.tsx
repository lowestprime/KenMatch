"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/avatar";
import { SignOutButton } from "@/components/auth-session-controls";
import type { ViewerSession } from "@/lib/types";

export function ProfileMenu({
  viewer,
  showAdminLink,
}: {
  viewer: ViewerSession;
  showAdminLink: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const label = viewer.profile.showRealName ? viewer.profile.name : `@${viewer.profile.username}`;

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open account menu for ${label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar profile={viewer.profile} size={38} />
        <span className="profile-menu-meta" aria-hidden="true">
          <span className="profile-menu-name">{label}</span>
          <span className="profile-menu-caption">{viewer.profile.availableCredits}/{viewer.profile.effectiveVoiceCredits} voice</span>
        </span>
        <svg className="profile-menu-chevron" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 7 5 5 5-5" />
        </svg>
      </button>
      {open ? (
        <div className="profile-menu-popover" role="menu" aria-label="Account menu">
          <div className="profile-menu-header">
            <Avatar profile={viewer.profile} size={42} />
            <div className="profile-menu-meta" style={{ display: "grid", maxWidth: "none" }}>
              <strong className="profile-menu-name">{label}</strong>
              <span className="profile-menu-caption">@{viewer.profile.username} · {viewer.profile.participationState}</span>
            </div>
          </div>
          <div className="profile-menu-actions">
            <Link className="profile-menu-item" href={`/people/${viewer.profile.id}`} role="menuitem" onClick={() => setOpen(false)}>
              Profile
            </Link>
            <Link className="profile-menu-item" href="/account" role="menuitem" onClick={() => setOpen(false)}>
              Account
            </Link>
            {showAdminLink ? (
              <Link className="profile-menu-item" href="/admin" role="menuitem" onClick={() => setOpen(false)}>
                Admin
              </Link>
            ) : null}
            <SignOutButton className="profile-menu-item is-danger" onSignedOut={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
