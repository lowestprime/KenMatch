"use client";

import { useState } from "react";

export function ShareButton({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/kens/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} — KenMatch`, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      type="button"
      className="vote-chip"
      onClick={handleShare}
      aria-label="Share this Ken"
      title="Share"
    >
      {copied ? "✓ Copied" : "↗ Share"}
    </button>
  );
}
