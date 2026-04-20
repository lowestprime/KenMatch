import Link from "next/link";

import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolved = await searchParams;
  const token = resolved?.token?.trim() ?? "";

  return (
    <div className="page-stack" style={{ maxWidth: "32rem", marginInline: "auto" }}>
      <section className="panel grid gap-3">
        <span className="eyebrow">Set a new password</span>
        <h1>Choose a new password</h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="alert alert-error">
            This reset link is missing its token. Request a new one from the
            <Link href="/forgot-password" className="underline" style={{ marginLeft: "0.25rem" }}>
              forgot password page
            </Link>
            .
          </div>
        )}
      </section>
    </div>
  );
}
