import type { LensRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, SeoFields, StatusSelect, TextArea } from "@/components/form-controls";
import { SaveBar } from "@/components/save-bar";

import { FormDisclosure, FormSection } from "./form-section";
import type { FormAction } from "./types";

interface LensFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  defaults?: LensRecord | undefined;
}

/** Full-page lens editor. Field names match `createLensAction`. */
export function LensForm({ action, title, submitLabel, defaults }: LensFormProps) {
  return (
    <ConfirmedForm action={action} confirm="off" trackDirty className="min-w-0">
      <SaveBar title={title} saveLabel={submitLabel} isNew={!defaults} />

      <div className="px-5 pb-24 pt-6 lg:px-8">
        <div className="grid max-w-4xl gap-6">
          {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

          <FormSection title="Basics" description="Name, slug, accent, and publish state.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" name="name" required defaultValue={defaults?.name} />
              <Field
                label="Slug"
                name="slug"
                required
                placeholder="build-product"
                defaultValue={defaults?.slug}
              />
              <Field
                label="Accent color"
                name="accentColor"
                placeholder="#7dd3fc"
                defaultValue={defaults?.accentColor}
                hint="Hex color used for this lens across the public site."
              />
            </div>
            <StatusSelect defaultValue={defaults?.status} />
          </FormSection>

          <FormSection title="Summary" description="Short description shown on the public lens page.">
            <TextArea label="Summary" name="summary" rows={4} defaultValue={defaults?.summary} />
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
