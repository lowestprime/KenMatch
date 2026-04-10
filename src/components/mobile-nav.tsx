"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/kens", label: "Projects" },
  { href: "/submit", label: "Propose" },
  { href: "/governance", label: "Governance" },
  { href: "/economics", label: "Funding" },
  { href: "/account", label: "Account" },
];

export function MobileNav({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const links = isSignedIn ? nav : nav.filter((n) => n.href !== "/account");

  return (
    <>
      <button
        type="button"
        className="mobile-nav-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className={`hamburger ${open ? "is-open" : ""}`} />
      </button>
      {open ? (
        <div className="mobile-nav-overlay" onClick={close}>
          <nav className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()} aria-label="Mobile navigation">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-link ${pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "is-active" : ""}`}
                onClick={close}
              >
                {item.label}
              </Link>
            ))}
            {!isSignedIn ? (
              <Link href="/auth" className="cta-primary mt-4 text-center" onClick={close}>Sign in</Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}
