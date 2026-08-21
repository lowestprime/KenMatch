"use client";

import { useState } from "react";

export function CopyTextButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className="cta-secondary cta-compact" type="button" onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
}
