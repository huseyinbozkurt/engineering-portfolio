import type { DecisionPatternEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { CheckboxGroup, Field, SeoFields, StatusSelect, TextArea } from "@/components/form-controls";
import { SaveBar } from "@/components/save-bar";

import { FormDisclosure, FormSection } from "./form-section";
import type { FormAction, RelationOption } from "./types";

interface DecisionPatternFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  principleOptions: RelationOption[];
  defaults?: DecisionPatternEditRecord | undefined;
}

/** Full-page decision-pattern editor. Field names match `createDecisionPatternAction`. */
export function DecisionPatternForm({
  action,
  title,
  submitLabel,
  principleOptions,
  defaults,
}: DecisionPatternFormProps) {
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
                placeholder="reduce-risk-early"
                defaultValue={defaults?.slug}
              />
            </div>
            <StatusSelect defaultValue={defaults?.status} />
          </FormSection>

          <FormSection
            title="Content"
            description="When to reach for this pattern and the trade-offs it manages."
          >
            <TextArea
              label="Summary"
              name="summary"
              rows={4}
              defaultValue={defaults?.summary}
              hint="One-line essence of the pattern."
            />
            <TextArea label="Body" name="body" rows={8} defaultValue={defaults?.body} />
          </FormSection>

          <FormDisclosure
            title="Related principles"
            description="Principles this pattern puts into practice."
          >
            <CheckboxGroup
              label="Related principles"
              name="principleIds"
              emptyLabel="No principles available."
              options={principleOptions}
              selectedIds={defaults?.principleIds}
            />
          </FormDisclosure>

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
