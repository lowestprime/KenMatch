"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/kens", label: "Projects" },
  { href: "/submit", label: "Propose" },
  { href: "/governance", label: "Governance" },
  { href: "/economics", label: "Funding" },
  { href: "/account", label: "Account" },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="site-nav" aria-label="Primary">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-pill ${isActive(item.href, pathname) ? "is-active" : ""}`}
          aria-current={isActive(item.href, pathname) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
