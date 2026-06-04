"use client";

import { useActionState, useEffect, useState } from "react";

import { submitContactForm } from "./actions";
import { initialContactFormState } from "./contact-form-state";

const inputClasses =
  "rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-teal-300/60";
const labelClasses = "grid gap-2 text-sm font-medium text-ink";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialContactFormState,
  );
  const [wantsResponse, setWantsResponse] = useState(state.values.wantsResponse);

  useEffect(() => {
    setWantsResponse(state.values.wantsResponse);
  }, [state.values.wantsResponse, state.version]);

  return (
    <form key={state.version} action={formAction} className="glass-panel grid gap-5 rounded-lg p-5">
      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-lg border border-teal-300/30 bg-teal-300/10 px-3 py-2 text-sm text-teal-100"
              : "rounded-lg border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-sm text-amber-100"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <label className={labelClasses}>
        <span>Name</span>
        <input
          aria-invalid={Boolean(state.fieldErrors.name)}
          className={inputClasses}
          defaultValue={state.values.name}
          maxLength={160}
          name="name"
          placeholder="Your name"
          required
        />
        <FieldError errors={state.fieldErrors.name} />
      </label>

      <label className={labelClasses}>
        <span>Message</span>
        <textarea
          aria-invalid={Boolean(state.fieldErrors.message)}
          className={`${inputClasses} min-h-40 resize-y leading-6`}
          defaultValue={state.values.message}
          maxLength={5000}
          name="message"
          placeholder="What would you like to talk about?"
          required
        />
        <FieldError errors={state.fieldErrors.message} />
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 text-sm text-muted">
        <input
          checked={wantsResponse}
          className="mt-1 size-4 rounded border-white/20 bg-white/[0.05]"
          name="wantsResponse"
          onChange={(event) => setWantsResponse(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block font-medium text-ink">I want you to contact me back</span>
          <span className="mt-1 block leading-5">
            Check this if you want a reply. Email becomes required when selected.
          </span>
        </span>
      </label>

      <label className={labelClasses}>
        <span>Email {wantsResponse ? <span className="text-amber-200">required</span> : null}</span>
        <input
          aria-invalid={Boolean(state.fieldErrors.email)}
          className={inputClasses}
          defaultValue={state.values.email}
          disabled={!wantsResponse}
          maxLength={320}
          name="email"
          placeholder={wantsResponse ? "you@example.com" : "Enable contact back to add email"}
          required={wantsResponse}
          type="email"
        />
        <FieldError errors={state.fieldErrors.email} />
      </label>

      <button
        className="rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] | undefined }) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return <span className="text-xs font-medium text-amber-200">{errors[0]}</span>;
}
