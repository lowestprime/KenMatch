"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({
  siteKey,
  action,
}: {
  siteKey?: string;
  action: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<string | null>(null);
  const elementId = `turnstile-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    const renderWidget = () => {
      const mount = document.getElementById(elementId);
      if (!mount || widgetRef.current || !window.turnstile) {
        return false;
      }

      widgetRef.current = window.turnstile.render(`#${elementId}`, {
        sitekey: siteKey,
        action,
        theme: "auto",
        callback: (token) => {
          if (inputRef.current) {
            inputRef.current.value = token;
          }
        },
        "expired-callback": () => {
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        },
        "error-callback": () => {
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        },
      });

      return true;
    };

    if (renderWidget()) {
      return () => {
        if (widgetRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetRef.current);
        }
        widgetRef.current = null;
      };
    }

    const interval = window.setInterval(() => {
      if (renderWidget()) {
        window.clearInterval(interval);
      }
    }, 300);

    return () => {
      window.clearInterval(interval);
      if (widgetRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetRef.current);
      }
      widgetRef.current = null;
    };
  }, [action, elementId, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div id={elementId} className="turnstile-shell" />
      <input ref={inputRef} type="hidden" name="turnstileToken" />
    </div>
  );
}
