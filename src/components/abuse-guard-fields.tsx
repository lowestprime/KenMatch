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
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
        <label>
          Leave this field empty
          <input tabIndex={-1} autoComplete="off" name="website" />
        </label>
      </div>
      <TurnstileWidget siteKey={siteKey} action={action} />
    </>
  );
}
