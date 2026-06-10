import type { PrincipleRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, SeoFields, StatusSelect, TextArea } from "@/components/form-controls";
import { SaveBar } from "@/components/save-bar";

import { FormDisclosure, FormSection } from "./form-section";
import type { FormAction } from "./types";

interface PrincipleFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  defaults?: PrincipleRecord | undefined;
}

/** Full-page principle editor. Field names match `createPrincipleAction`. */
export function PrincipleForm({ action, title, submitLabel, defaults }: PrincipleFormProps) {
  return (
    <ConfirmedForm action={action} confirm="off" trackDirty className="min-w-0">
      <SaveBar title={title} saveLabel={submitLabel} isNew={!defaults} />

      <div className="px-5 pb-24 pt-6 lg:px-8">
        <div className="grid max-w-4xl gap-6">
          {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

          <FormSection title="Basics" description="Title, slug, and publish state.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" name="title" required defaultValue={defaults?.title} />
              <Field
                label="Slug"
                name="slug"
                required
                placeholder="simplify-complexity"
                defaultValue={defaults?.slug}
              />
            </div>
            <StatusSelect defaultValue={defaults?.status} />
          </FormSection>

          <FormSection title="Content" description="The principle itself and why it matters.">
            <TextArea
              label="Summary"
              name="summary"
              rows={4}
              defaultValue={defaults?.summary}
              hint="One-line essence shown on cards and lists."
            />
            <TextArea
              label="Body"
              name="body"
              rows={8}
              defaultValue={defaults?.body}
              hint="How the principle shapes decisions in practice."
            />
          </FormSection>

          <FormDisclosure
            title="Ordering & SEO"
            description="Display order plus optional search and social overrides."
          >
            <Field
              label="Order (lower shows first)"
              name="position"
              type="number"
              defaultValue={defaults ? String(defaults.position) : undefined}
            />
            <SeoFields bare defaults={defaults} />
          </FormDisclosure>
        </div>
      </div>
    </ConfirmedForm>
  );
}
