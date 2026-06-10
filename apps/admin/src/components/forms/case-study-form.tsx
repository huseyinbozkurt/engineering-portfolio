import type { CaseStudyEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { CheckboxGroup, Field, SeoFields, StatusSelect, TextArea } from "@/components/form-controls";
import { SaveBar } from "@/components/save-bar";

import { FormDisclosure, FormSection } from "./form-section";
import type { FormAction, RelationOption } from "./types";

interface CaseStudyFormProps {
  action: FormAction;
  title: string;
  submitLabel: string;
  lensOptions: RelationOption[];
  principleOptions: RelationOption[];
  experienceOptions: RelationOption[];
  projectOptions: RelationOption[];
  skillOptions: RelationOption[];
  tagOptions: RelationOption[];
  defaults?: CaseStudyEditRecord | undefined;
}

/**
 * Full-page case-study editor. The seven-part narrative is the core content and
 * gets its own section; relationships and SEO/ordering collapse into
 * disclosures. Field names match `createCaseStudyAction` exactly.
 */
export function CaseStudyForm({
  action,
  title,
  submitLabel,
  lensOptions,
  principleOptions,
  experienceOptions,
  projectOptions,
  skillOptions,
  tagOptions,
  defaults,
}: CaseStudyFormProps) {
  return (
    <ConfirmedForm action={action} confirm="off" trackDirty className="min-w-0">
      <SaveBar title={title} saveLabel={submitLabel} isNew={!defaults} />

      <div className="px-5 pb-24 pt-6 lg:px-8">
        <div className="grid max-w-4xl gap-6">
          {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}

          <FormSection title="Basics" description="Title, slug, publish state, and the card excerpt.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" name="title" required defaultValue={defaults?.title} />
              <Field
                label="Slug"
                name="slug"
                required
                placeholder="payments-platform-reliability"
                defaultValue={defaults?.slug}
              />
            </div>
            <StatusSelect defaultValue={defaults?.status} />
            <TextArea
              label="Excerpt"
              name="excerpt"
              rows={4}
              defaultValue={defaults?.excerpt}
              hint="Short teaser shown on case-study cards and list pages."
            />
          </FormSection>

          <FormSection
            title="Story"
            description="The narrative arc rendered on the case-study page, from context to learning."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <TextArea label="Context" name="context" rows={5} defaultValue={defaults?.context} />
              <TextArea label="Problem" name="problem" rows={5} defaultValue={defaults?.problem} />
              <TextArea
                label="Constraints"
                name="constraints"
                rows={5}
                defaultValue={defaults?.constraints}
              />
              <TextArea label="What I Did" name="action" rows={5} defaultValue={defaults?.action} />
              <TextArea
                label="Trade-offs"
                name="tradeoffs"
                rows={5}
                defaultValue={defaults?.tradeoffs}
              />
              <TextArea label="Outcome" name="outcome" rows={5} defaultValue={defaults?.outcome} />
            </div>
            <TextArea
              label="What I Learned"
              name="learning"
              rows={5}
              defaultValue={defaults?.learning}
            />
          </FormSection>

          <FormDisclosure
            title="Relationships"
            description="Connect the case study to lenses, principles, experience, projects, skills, and tags."
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
              label="Related experience"
              name="experienceIds"
              emptyLabel="No experience available."
              options={experienceOptions}
              selectedIds={defaults?.experienceIds}
            />
            <CheckboxGroup
              label="Related projects"
              name="projectIds"
              emptyLabel="No projects available."
              options={projectOptions}
              selectedIds={defaults?.projectIds}
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
