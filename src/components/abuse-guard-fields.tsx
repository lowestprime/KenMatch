import { TurnstileWidget } from "@/components/turnstile-widget";

export function AbuseGuardFields({
  action,
  siteKey,
}: {
  action: string;
  siteKey?: string;
}) {
  return (
    <>
      <label className="sr-only" aria-hidden="true">
        Leave this field empty
        <input tabIndex={-1} autoComplete="off" name="website" className="hidden" />
      </label>
      <TurnstileWidget siteKey={siteKey} action={action} />
    </>
  );
}
