import type { ContactProfileRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, TextArea } from "@/components/form-controls";
import { SaveBar } from "@/components/save-bar";

import { CollectionEditor } from "./collection-editor";
import { FormSection } from "./form-section";
import type { FormAction } from "./types";

interface ContactProfileFormProps {
  action: FormAction;
  defaults?: ContactProfileRecord | null | undefined;
}

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Full-page contact-profile editor with the same save bar as the homepage
 * builder. The "open to" list uses the collection editor and serializes to the
 * newline format `upsertContactProfileAction` already parses.
 */
export function ContactProfileForm({ action, defaults }: ContactProfileFormProps) {
  return (
    <ConfirmedForm action={action} confirm="off" trackDirty className="min-w-0">
      <SaveBar
        title="Contact Profile"
        saveLabel="Save contact profile"
        previewHref={`${PUBLIC_SITE_URL.replace(/\/$/, "")}/contact`}
      />

      <div className="px-5 pb-24 pt-6 lg:px-8">
        <div className="grid max-w-4xl gap-6">
          <FormSection
            title="Profile metadata"
            description="Location, availability, and the intro shown on the public contact page."
          >
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
            <CollectionEditor
              name="openToItems"
              label="Open to"
              defaultItems={defaults?.openToItems ?? []}
              max={12}
              maxLength={160}
              placeholder="Senior Frontend Engineering"
              hint="Engagement types listed on the contact page."
              addLabel="Add item"
            />
          </FormSection>

          <FormSection title="Direct links" description="Where the contact buttons point.">
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
          </FormSection>
        </div>
      </div>
    </ConfirmedForm>
  );
}
