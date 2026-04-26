"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

import { signOutAction } from "@/app/actions";
import { Avatar } from "@/components/avatar";
import type { ViewerSession } from "@/lib/types";

export type MobileNavLink = { href: string; label: string };

export function MobileNav({
  primaryNav,
  showAdminLink,
  viewer,
}: {
  primaryNav: MobileNavLink[];
  showAdminLink: boolean;
  viewer: ViewerSession | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      document.body.classList.add("mobile-nav-open");
    } else {
      document.body.classList.remove("mobile-nav-open");
    }
    return () => document.body.classList.remove("mobile-nav-open");
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="mobile-nav-trigger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>
      {open && typeof document !== "undefined" ? createPortal(
        <div id="mobile-nav-drawer" className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Site navigation">
          <button
            type="button"
            className="mobile-nav-backdrop"
            onClick={close}
            aria-label="Close menu"
          />
          <aside className="mobile-nav-panel">
            <div className="mobile-nav-header">
              <span className="eyebrow">Navigate</span>
              <button type="button" className="mobile-nav-close" onClick={close} aria-label="Close menu">
                ✕
              </button>
            </div>
            <nav className="mobile-nav-links" aria-label="Primary">
              {primaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-nav-link${pathname === item.href ? " is-active" : ""}`}
                  onClick={close}
                >
                  {item.label}
                </Link>
              ))}
              {showAdminLink ? (
                <Link
                  href="/admin"
                  className={`mobile-nav-link is-admin${pathname?.startsWith("/admin") ? " is-active" : ""}`}
                  onClick={close}
                >
                  Admin
                </Link>
              ) : null}
            </nav>
            <div className="mobile-nav-footer">
              {viewer ? (
                <>
                  <Link href={`/people/${viewer.profile.id}`} className="mobile-nav-viewer" onClick={close}>
                    <Avatar profile={viewer.profile} size={38} />
                    <span>
                      <strong>{viewer.profile.showRealName ? viewer.profile.name : `@${viewer.profile.username}`}</strong>
                      <span className="mobile-nav-viewer-meta">
                        @{viewer.profile.username} · {viewer.profile.availableCredits}/{viewer.profile.effectiveVoiceCredits} voice
                      </span>
                    </span>
                  </Link>
                  <div className="mobile-nav-actions">
                    <Link href="/account" className="cta-secondary cta-compact" onClick={close}>
                      Account
                    </Link>
                    <form action={signOutAction}>
                      <button type="submit" className="cta-secondary cta-compact" onClick={close}>
                        Sign out
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <Link href="/auth" className="cta-primary cta-compact" onClick={close}>
                  Sign in
                </Link>
              )}
            </div>
          </aside>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
