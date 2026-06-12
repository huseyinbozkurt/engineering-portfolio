import type { ExperienceEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import {
  Checkbox,
  CheckboxGroup,
  Field,
  SeoFields,
  StatusSelect,
  TextArea,
} from "@/components/form-controls";
import { SaveBar } from "@/components/save-bar";

import { FormDisclosure, FormSection } from "./form-section";
import { RichTextField } from "./rich-text-field";
import type { FormAction, RelationOption } from "./types";

interface ExperienceFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  lensOptions: RelationOption[];
  principleOptions: RelationOption[];
  skillOptions: RelationOption[];
  tagOptions: RelationOption[];
  defaults?: ExperienceEditRecord | undefined;
}

/**
 * Full-page experience editor: role basics and tenure first, then content,
 * with relationships and SEO/ordering in disclosures. Field names match
 * `createExperienceAction` exactly.
 */
export function ExperienceForm({
  action,
  title,
  submitLabel,
  lensOptions,
  principleOptions,
  skillOptions,
  tagOptions,
  defaults,
}: ExperienceFormProps) {
  return (
    <ConfirmedForm action={action} confirm="off" trackDirty className="min-w-0">
      <SaveBar title={title} saveLabel={submitLabel} isNew={!defaults} />

      <div className="px-5 pb-24 pt-6 lg:px-8">
        <div className="grid max-w-4xl gap-6">
          {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

          <FormSection title="Role" description="Company, role, and publish state.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company" name="company" defaultValue={defaults?.company} />
              <Field label="Role" name="role" defaultValue={defaults?.role} />
              <Field
                label="Slug"
                name="slug"
                placeholder="huawei-team-lead"
                defaultValue={defaults?.slug ?? undefined}
              />
              <Field
                label="Location"
                name="location"
                defaultValue={defaults?.location ?? undefined}
              />
            </div>
            <StatusSelect defaultValue={defaults?.status} />
          </FormSection>

          <FormSection title="Tenure" description="When the role started and whether it is current.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Start date"
                name="startDate"
                type="date"
                defaultValue={defaults?.startDate ?? undefined}
              />
              <Field
                label="End date"
                name="endDate"
                type="date"
                defaultValue={defaults?.endDate ?? undefined}
              />
            </div>
            <Checkbox
              label="Current role"
              name="isCurrent"
              defaultChecked={defaults?.isCurrent ?? false}
            />
          </FormSection>

          <FormSection title="Content" description="What visitors read on the experience page.">
            <RichTextField
              label="Summary"
              name="summary"
              rows={6}
              defaultValue={defaults?.summary}
              hint="Short overview shown at the top of the experience page."
            />
            <RichTextField
              label="Details"
              name="details"
              rows={14}
              defaultValue={defaults?.details}
              hint="Long-form, in-depth content shown lower on the experience detail page."
            />
            <TextArea
              label="Awards & Recognition"
              name="awards"
              rows={4}
              defaultValue={defaults?.awards}
              placeholder="One employer feedback note, award, or recognition per line"
              hint="Keep each item brief. The experience detail page displays up to 3."
            />
          </FormSection>

          <FormDisclosure
            title="Relationships"
            description="Link the experience to lenses, principles, skills, and tags."
          >
            <CheckboxGroup
              label="Related lenses"
              name="lensIds"
              emptyLabel="No lenses available."
              options={lensOptions}
              selectedIds={defaults?.lensIds}
            />
            <CheckboxGroup
              label="Related principles"
              name="principleIds"
              emptyLabel="No principles available."
              options={principleOptions}
              selectedIds={defaults?.principleIds}
            />
            <CheckboxGroup
              label="Skills"
              name="skillIds"
              emptyLabel="No skills available."
              options={skillOptions}
              selectedIds={defaults?.skillIds}
            />
            <CheckboxGroup
              label="Tags"
              name="tagIds"
              emptyLabel="No tags available."
              options={tagOptions}
              selectedIds={defaults?.tagIds}
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
