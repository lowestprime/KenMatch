"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export type PrimaryNavItem = { href: string; label: string };

function isActive(pathname: string | null, href: string) {
  if (href === "/") return pathname === "/";
  return Boolean(pathname === href || pathname?.startsWith(`${href}/`));
}

export function PrimaryNav({ items }: { items: PrimaryNavItem[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = activeRef.current;
    if (!active || pathname === "/") {
      nav.scrollTo({ left: 0, behavior: "auto" });
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const edgePadding = 8;
    if (activeRect.left < navRect.left + edgePadding) {
      nav.scrollTo({
        left: Math.max(0, nav.scrollLeft - (navRect.left + edgePadding - activeRect.left)),
        behavior: "auto",
      });
    } else if (activeRect.right > navRect.right - edgePadding) {
      nav.scrollTo({
        left: nav.scrollLeft + (activeRect.right - (navRect.right - edgePadding)),
        behavior: "auto",
      });
    }
  }, [pathname]);

  return (
    <nav ref={navRef} className="site-nav" aria-label="Primary">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            ref={active ? activeRef : undefined}
            href={item.href}
            className="nav-pill"
            data-active={active ? "true" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
