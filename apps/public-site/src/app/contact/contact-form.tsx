"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

import { submitContactForm } from "./actions";
import type { ContactFormValues } from "./contact-form-state";
import { initialContactFormState } from "./contact-form-state";

const inputClasses =
  "w-full rounded-lg border border-white/12 bg-[#060b14] px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-violet-300/60 focus:ring-2 focus:ring-violet-300/20";
const labelClasses = "grid gap-2 text-sm font-medium text-ink";

type DynamicFieldName =
  | "company"
  | "roleTitle"
  | "techStack"
  | "problem"
  | "desiredOutcome"
  | "timeline";

interface DynamicField {
  name: DynamicFieldName;
  label: string;
  placeholder: string;
  kind: "input" | "textarea";
  rows?: number;
}

interface IntentOption {
  value: ContactFormValues["intent"];
  label: string;
  short: string;
  messageLabel: string;
  messagePlaceholder: string;
  extraFields: DynamicField[];
}

const intentOptions = [
  {
    value: "technicalConsultation",
    label: "Technical consultation",
    short: "A focused architecture, delivery, or product engineering discussion.",
    messageLabel: "Consultation brief",
    messagePlaceholder:
      "Describe the technical question, the current state, and what decision or clarity you need.",
    extraFields: [
      {
        name: "techStack",
        label: "Tech stack",
        placeholder: "Frameworks, cloud, data, AI tools, CI/CD, monitoring...",
        kind: "textarea",
        rows: 3,
      },
      {
        name: "problem",
        label: "Technical challenge",
        placeholder: "What is blocked, risky, slow, unclear, or expensive right now?",
        kind: "textarea",
        rows: 4,
      },
      {
        name: "desiredOutcome",
        label: "Desired outcome",
        placeholder: "A decision, plan, audit, prototype, migration path, or delivery support.",
        kind: "textarea",
        rows: 3,
      },
    ],
  },
  {
    value: "hiring",
    label: "Hiring",
    short: "Role, team, and engineering fit.",
    messageLabel: "Brief job description",
    messagePlaceholder:
      "Share the role, team context, must-have technical scope, and why this position may fit.",
    extraFields: [
      {
        name: "company",
        label: "Company",
        placeholder: "Company or team name",
        kind: "input",
      },
      {
        name: "roleTitle",
        label: "Role / title",
        placeholder: "Senior Frontend Engineer, Staff Engineer, Tech Lead...",
        kind: "input",
      },
      {
        name: "timeline",
        label: "Timeline",
        placeholder: "Immediate, this quarter, exploratory...",
        kind: "input",
      },
    ],
  },
  {
    value: "architecture",
    label: "Architecture / technical leadership",
    short: "System design, platform direction, and engineering decisions.",
    messageLabel: "Architecture context",
    messagePlaceholder:
      "Summarize the system, decision pressure, constraints, and the outcome you want.",
    extraFields: [
      {
        name: "techStack",
        label: "Current architecture / stack",
        placeholder: "Core services, frontend, backend, data, cloud, deployment model...",
        kind: "textarea",
        rows: 3,
      },
      {
        name: "problem",
        label: "Decision point",
        placeholder: "What tradeoff, migration, scaling issue, or ownership question matters?",
        kind: "textarea",
        rows: 4,
      },
      {
        name: "timeline",
        label: "Decision timeline",
        placeholder: "This sprint, before launch, roadmap planning...",
        kind: "input",
      },
    ],
  },
  {
    value: "aiAutomation",
    label: "AI / automation",
    short: "AI-assisted workflows, internal tools, and product automation.",
    messageLabel: "Automation brief",
    messagePlaceholder:
      "Describe the workflow, user pain, data involved, and what should become faster or smarter.",
    extraFields: [
      {
        name: "techStack",
        label: "Tools and systems",
        placeholder: "Apps, APIs, LLM providers, databases, documents, queues, auth...",
        kind: "textarea",
        rows: 3,
      },
      {
        name: "problem",
        label: "Workflow problem",
        placeholder: "What manual process, decision loop, or quality issue should improve?",
        kind: "textarea",
        rows: 4,
      },
      {
        name: "desiredOutcome",
        label: "Success signal",
        placeholder: "Time saved, better accuracy, fewer handoffs, safer review, new capability...",
        kind: "textarea",
        rows: 3,
      },
    ],
  },
  {
    value: "frontendProduct",
    label: "Frontend / product engineering",
    short: "Interfaces, UX systems, performance, and product delivery.",
    messageLabel: "Product brief",
    messagePlaceholder:
      "Share the product surface, users, technical constraints, and what needs to ship or improve.",
    extraFields: [
      {
        name: "techStack",
        label: "Frontend stack",
        placeholder: "Next.js, React, design system, APIs, analytics, testing...",
        kind: "textarea",
        rows: 3,
      },
      {
        name: "problem",
        label: "Product / UX problem",
        placeholder: "What is confusing, slow, missing, hard to maintain, or hard to ship?",
        kind: "textarea",
        rows: 4,
      },
      {
        name: "timeline",
        label: "Delivery window",
        placeholder: "Prototype, MVP, launch date, ongoing support...",
        kind: "input",
      },
    ],
  },
  {
    value: "collaboration",
    label: "Collaboration",
    short: "Open-ended engineering projects, writing, experiments, or advisory work.",
    messageLabel: "Collaboration idea",
    messagePlaceholder:
      "Tell me what you are building, exploring, or trying to make real.",
    extraFields: [
      {
        name: "company",
        label: "Organization / project",
        placeholder: "Company, community, startup, or personal project",
        kind: "input",
      },
      {
        name: "desiredOutcome",
        label: "What good looks like",
        placeholder: "A shipped feature, clearer direction, stronger system, proof of concept...",
        kind: "textarea",
        rows: 3,
      },
    ],
  },
  {
    value: "other",
    label: "Other",
    short: "For anything else that doesn't fit the above categories.",
    messageLabel: "Message",
    messagePlaceholder:
      "Tell me what you are looking for or want to share, and I'll do my best to respond thoughtfully.",
    extraFields: []
  }
] satisfies IntentOption[];

const defaultIntent = intentOptions[0]!;

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    initialContactFormState,
  );
  const [values, setValues] = useState<ContactFormValues>(initialContactFormState.values);

  // Turnstile is enabled only when a site key is configured, so the form keeps
  // working unchanged where it is not set (e.g. local development / previews).
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    if (state.status === "success") {
      setValues(initialContactFormState.values);
    } else if (state.version > 0) {
      setValues(state.values);
    }

    // Turnstile tokens are single-use, so after any completed submission clear
    // the stored token and reset the widget. Managed mode immediately issues a
    // fresh token for the next attempt.
    if (state.version > 0 && turnstileSiteKey) {
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }, [state.status, state.values, state.version, turnstileSiteKey]);

  const activeIntent = useMemo(
    () => intentOptions.find((intent) => intent.value === values.intent) ?? defaultIntent,
    [values.intent],
  );

  const requiredComplete = [values.name, values.email, values.message].filter(
    (value) => value.trim().length > 0,
  ).length;

  function updateValue<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={formAction} className="glass-panel grid gap-5 rounded-lg p-5">
      <input name="intent" type="hidden" value={values.intent} />
      <input name="wantsResponse" type="hidden" value="true" />
      <input name="turnstileToken" type="hidden" value={turnstileToken ?? ""} />
      <HoneypotField />

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100"
              : "rounded-lg border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-sm text-amber-100"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <IntentPicker
        activeIntent={activeIntent}
        values={values}
        onChange={(intent) => updateValue("intent", intent)}
      />

      <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Full Name"
            name="name"
            value={values.name}
            onChange={(value) => updateValue("name", value)}
            error={state.fieldErrors.name}
            placeholder="Your full name"
            required
          />
          <TextInput
            label="E-mail address"
            name="email"
            value={values.email}
            onChange={(value) => updateValue("email", value)}
            error={state.fieldErrors.email}
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <TextAreaInput
          label={activeIntent.messageLabel}
          name="message"
          value={values.message}
          onChange={(value) => updateValue("message", value)}
          error={state.fieldErrors.message}
          placeholder={activeIntent.messagePlaceholder}
          rows={5}
          required
        />
      </section>

      {activeIntent.extraFields.length > 0 && (
        <AdaptiveDetails
          activeIntent={activeIntent}
          values={values}
          onValue={updateValue}
          fieldErrors={state.fieldErrors}
        />
      )}

      <ContactPreview
        activeIntent={activeIntent}
        requiredComplete={requiredComplete}
        values={values}
      />

      {turnstileSiteKey ? (
        <Turnstile
          ref={turnstileRef}
          siteKey={turnstileSiteKey}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
          options={{ appearance: "interaction-only", size: "flexible", theme: "dark" }}
          className="w-full min-w-0"
        />
      ) : null}

      <button
        className="rounded-lg bg-gradient-to-r from-violet-500 to-sky-400 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending || (Boolean(turnstileSiteKey) && !turnstileToken)}
        type="submit"
      >
        {isPending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}

function IntentPicker({
  activeIntent,
  values,
  onChange,
}: {
  activeIntent: IntentOption;
  values: ContactFormValues;
  onChange: (intent: ContactFormValues["intent"]) => void;
}) {
  return (
    <section className="rounded-lg border border-violet-300/20 bg-[#050914] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-violet-200">contact.intent</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">{activeIntent.label}</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {intentOptions.map((intent) => {
          const isActive = values.intent === intent.value;

          return (
            <button
              aria-pressed={isActive}
              className={
                isActive
                  ? "rounded-lg border border-violet-300/50 bg-violet-300/15 p-3 text-left text-ink shadow-[0_0_24px_rgba(139,92,246,0.14)]"
                  : "rounded-lg border border-line bg-white/[0.035] p-3 text-left text-muted transition hover:border-violet-300/40 hover:bg-white/[0.055] hover:text-ink"
              }
              key={intent.value}
              onClick={() => onChange(intent.value)}
              type="button"
            >
              <span className="block text-sm font-semibold">{intent.label}</span>
              <span className="mt-1 block text-xs leading-5">{intent.short}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AdaptiveDetails({
  activeIntent,
  values,
  onValue,
  fieldErrors,
}: {
  activeIntent: IntentOption;
  values: ContactFormValues;
  onValue: <K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) => void;
  fieldErrors: Partial<Record<keyof ContactFormValues, string[]>>;
}) {
  return (
    <section className="grid gap-4 rounded-lg border border-line bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{activeIntent.label} details</h3>
        <span className="text-xs text-muted">Optional context</span>
      </div>
      <div className="grid gap-4">
        {activeIntent.extraFields.map((field) =>
          field.kind === "textarea" ? (
            <TextAreaInput
              error={fieldErrors[field.name]}
              key={field.name}
              label={field.label}
              name={field.name}
              onChange={(value) => onValue(field.name, value)}
              placeholder={field.placeholder}
              rows={field.rows ?? 3}
              value={values[field.name] ?? ""}
            />
          ) : (
            <TextInput
              error={fieldErrors[field.name]}
              key={field.name}
              label={field.label}
              name={field.name}
              onChange={(value) => onValue(field.name, value)}
              placeholder={field.placeholder}
              value={values[field.name] ?? ""}
            />
          ),
        )}
      </div>
    </section>
  );
}

function ContactPreview({
  activeIntent,
  requiredComplete,
  values,
}: {
  activeIntent: IntentOption;
  requiredComplete: number;
  values: ContactFormValues;
}) {
  const activeDetails = activeIntent.extraFields
    .map((field) => [field.label, values[field.name]] as const)
    .filter(([, value]) => value.trim().length > 0);

  return (
    <section className="rounded-lg border border-line bg-[#060b14] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">Message preview</h3>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted">
          {requiredComplete}/3 required ready
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted/70">Intent</dt>
          <dd className="mt-1 text-ink">{activeIntent.label}</dd>
        </div>
        {activeDetails.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-muted/70">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap leading-6 text-muted">{value}</dd>
          </div>
        ))}
      </dl>
      {values.message.trim() ? (
        <p className="mt-4 border-t border-line pt-4 text-sm leading-6 text-muted">
          {values.message}
        </p>
      ) : (
        <p className="mt-4 border-t border-line pt-4 text-sm leading-6 text-muted">
          Your required message will appear here as you type.
        </p>
      )}
    </section>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  type = "text",
}: {
  label: string;
  name: keyof ContactFormValues;
  value: string;
  onChange: (value: string) => void;
  error?: string[] | undefined;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "email";
}) {
  return (
    <label className={labelClasses}>
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {required ? <span className="text-xs font-medium text-amber-200">Required</span> : null}
      </span>
      <input
        aria-invalid={Boolean(error)}
        className={inputClasses}
        maxLength={type === "email" ? 320 : 180}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
      <FieldError errors={error} />
    </label>
  );
}

function TextAreaInput({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  rows,
}: {
  label: string;
  name: keyof ContactFormValues;
  value: string;
  onChange: (value: string) => void;
  error?: string[] | undefined;
  required?: boolean;
  placeholder?: string;
  rows: number;
}) {
  return (
    <label className={labelClasses}>
      <span className="flex items-center gap-2">
        <span>{label}</span>
        {required ? <span className="text-xs font-medium text-amber-200">Required</span> : null}
      </span>
      <textarea
        aria-invalid={Boolean(error)}
        className={`${inputClasses} resize-y leading-6`}
        maxLength={5000}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
      />
      <FieldError errors={error} />
    </label>
  );
}

function FieldError({ errors }: { errors?: string[] | undefined }) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return <span className="text-xs font-medium text-amber-200">{errors[0]}</span>;
}

// Honeypot: a real, named field that is submitted with the form but is invisible
// to humans and assistive technology. Naive spambots fill every field, so a
// non-empty value is a strong bot signal (checked server-side). Inline styles
// keep it hidden regardless of future CSS/utility changes; `aria-hidden` removes
// it from the accessibility tree and `tabIndex={-1}` keeps it out of tab order.
function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      <label htmlFor="contact-company-website">Company website</label>
      <input
        id="contact-company-website"
        type="text"
        name="companyWebsite"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        defaultValue=""
      />
    </div>
  );
}
