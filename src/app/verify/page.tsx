import Link from "next/link";

import { verifyEmailAction } from "@/app/actions";

export const metadata = { title: "Verify email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolved = await searchParams;
  const token = resolved?.token?.trim() ?? "";
  if (!token) {
    return (
      <div className="page-stack" style={{ maxWidth: "32rem", marginInline: "auto" }}>
        <section className="panel grid gap-3">
          <span className="eyebrow">Email verification</span>
          <h1>Missing token</h1>
          <div className="alert alert-error">
            This verification link is incomplete. Ask us to resend it from
            <Link href="/auth" className="underline" style={{ marginLeft: "0.25rem" }}>
              the sign-in page
            </Link>
            .
          </div>
        </section>
      </div>
    );
  }
  const result = await verifyEmailAction(token);
  return (
    <div className="page-stack" style={{ maxWidth: "32rem", marginInline: "auto" }}>
      <section className="panel grid gap-3">
        <span className="eyebrow">Email verification</span>
        <h1>{result.ok ? "Email confirmed" : "Link issue"}</h1>
        <div className={`alert ${result.ok ? "alert-success" : "alert-error"}`}>{result.message}</div>
        <p>
          <Link href="/auth" className="cta-primary cta-compact">
            {result.ok ? "Sign in now" : "Back to sign in"}
          </Link>
        </p>
      </section>
    </div>
  );
}
