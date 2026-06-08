import type { ContactProfileRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, SubmitButton, TextArea } from "@/components/form-controls";

import type { FormAction } from "./types";

interface ContactProfileFormProps {
  action: FormAction;
  defaults?: ContactProfileRecord | null | undefined;
}

export function ContactProfileForm({ action, defaults }: ContactProfileFormProps) {
  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: "Save contact profile?",
        description: "This updates the public contact page metadata and direct links.",
        confirmLabel: "Save contact profile",
      }}
    >
      <section className="grid gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
        <h2 className="text-lg font-semibold text-ink">Profile metadata</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Location"
            name="locationLabel"
            placeholder="Toronto, Canada"
            defaultValue={defaults?.locationLabel ?? undefined}
          />
          <Field
            label="Availability"
            name="availabilityLabel"
            placeholder="Open to full-time, contract, and consulting opportunities"
            defaultValue={defaults?.availabilityLabel ?? undefined}
          />
          <Field
            label="Timezone"
            name="timezoneLabel"
            placeholder="EST / EDT"
            defaultValue={defaults?.timezoneLabel ?? undefined}
          />
          <Field
            label="Response time"
            name="responseTimeLabel"
            placeholder="Usually responds within 24-48 hours"
            defaultValue={defaults?.responseTimeLabel ?? undefined}
          />
        </div>
        <TextArea
          label="Short contact intro"
          name="shortContactIntro"
          rows={4}
          placeholder="Based in Toronto and open to remote or hybrid engineering roles..."
          defaultValue={defaults?.shortContactIntro ?? undefined}
        />
        <TextArea
          label="Open to"
          name="openToItems"
          rows={6}
          placeholder={"Senior Frontend Engineering\nTechnical Leadership\nAI-enabled Product Development"}
          defaultValue={(defaults?.openToItems ?? []).join("\n")}
        />
      </section>

      <section className="grid gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
        <h2 className="text-lg font-semibold text-ink">Direct links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="LinkedIn URL"
            name="linkedinUrl"
            type="url"
            placeholder="https://www.linkedin.com/in/..."
            defaultValue={defaults?.linkedinUrl ?? undefined}
          />
          <Field
            label="GitHub URL"
            name="githubUrl"
            type="url"
            placeholder="https://github.com/..."
            defaultValue={defaults?.githubUrl ?? undefined}
          />
          <Field
            label="Email address"
            name="emailAddress"
            type="email"
            placeholder="you@example.com"
            defaultValue={defaults?.emailAddress ?? undefined}
          />
          <Field
            label="Resume URL"
            name="resumeUrl"
            type="url"
            placeholder="https://..."
            defaultValue={defaults?.resumeUrl ?? undefined}
          />
        </div>
      </section>

      <SubmitButton label="Save contact profile" />
    </ConfirmedForm>
  );
}
