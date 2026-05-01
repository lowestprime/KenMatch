"use client";

import { useActionState } from "react";

import { contactOwnerAction } from "@/app/actions";
import { initialActionState } from "@/app/action-state";
import { AbuseGuardFields } from "@/components/abuse-guard-fields";

export function ContactForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [state, formAction, pending] = useActionState(contactOwnerAction, initialActionState);

  function errorFor(field: string) {
    return state.fieldErrors?.[field];
  }

  return (
    <form action={formAction} className="contact-form">
      <AbuseGuardFields action="contact-owner" siteKey={turnstileSiteKey} />
      <div className="form-grid form-grid-two">
        <label className="field-label">
          <span>Title</span>
          <input name="title" className="field" required maxLength={140} placeholder="Short subject" disabled={pending} />
          {errorFor("title") ? <small className="field-error">{errorFor("title")}</small> : null}
        </label>
        <label className="field-label">
          <span>Reply email</span>
          <input name="replyEmail" type="email" className="field" required placeholder="you@example.com" disabled={pending} />
          {errorFor("replyEmail") ? <small className="field-error">{errorFor("replyEmail")}</small> : null}
        </label>
      </div>
      <label className="field-label">
        <span>Topic</span>
        <select name="topic" className="field" defaultValue="question" disabled={pending}>
          <option value="question">Question</option>
          <option value="suggestion">Suggestion</option>
          <option value="bug">Bug report</option>
          <option value="partnership">Partnership or sponsorship</option>
          <option value="press">Press</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="field-label">
        <span>Message markdown</span>
        <textarea
          name="bodyMarkdown"
          className="field contact-body-field"
          required
          minLength={20}
          maxLength={8000}
          placeholder="Write the question, suggestion, context, links, or markdown-formatted notes Cooper should review."
          disabled={pending}
        />
        {errorFor("bodyMarkdown") ? <small className="field-error">{errorFor("bodyMarkdown")}</small> : null}
      </label>
      <label className="field-label">
        <span>Attachments</span>
        <input
          name="attachments"
          type="file"
          className="field"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md,.csv,image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/markdown,text/csv"
          disabled={pending}
        />
        <small>Up to 3 files, 2 MB each, 6 MB total.</small>
      </label>
      <div className="form-footer">
        <button type="submit" className="cta-primary" disabled={pending}>{pending ? "Sending..." : "Send message"}</button>
        {state.message ? <p className={`form-message ${state.status === "error" ? "is-error" : "is-success"}`}>{state.message}</p> : null}
      </div>
    </form>
  );
}
