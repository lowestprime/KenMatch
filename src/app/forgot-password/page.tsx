import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="page-stack" style={{ maxWidth: "32rem", marginInline: "auto" }}>
      <section className="panel grid gap-3">
        <span className="eyebrow">Account recovery</span>
        <h1>Forgot your password?</h1>
        <p className="text-muted" style={{ color: "var(--muted)" }}>
          Enter the email on file and we&apos;ll send you a link to set a new password. Links expire in 30 minutes.
        </p>
        <ForgotPasswordForm />
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          <Link href="/auth" className="underline">Return to sign in</Link>
        </p>
      </section>
    </div>
  );
}
