import type { CaseStudyEditRecord } from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import {
  CheckboxGroup,
  Field,
  SeoFields,
  StatusSelect,
  SubmitButton,
  TextArea,
} from "@/components/form-controls";

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
  const isEditing = Boolean(defaults);

  return (
    <ConfirmedForm
      action={action}
      className="grid gap-5"
      confirmation={{
        title: isEditing ? "Save case study changes?" : "Create this case study?",
        description: isEditing
          ? "This will update the case study and its selected relationships."
          : "This will add a new case study to the admin content library.",
        confirmLabel: submitLabel,
      }}
    >
      <div className="grid gap-4">
        {defaults ? <input type="hidden" name="id" value={defaults.id} /> : null}
        <Field label="Title" name="title" required defaultValue={defaults?.title} />
        <Field
          label="Slug"
          name="slug"
          required
          placeholder="payments-platform-reliability"
          defaultValue={defaults?.slug}
        />
        <StatusSelect defaultValue={defaults?.status} />
        <Field
          label="Position"
          name="position"
          type="number"
          defaultValue={defaults ? String(defaults.position) : undefined}
        />
        <TextArea label="Excerpt" name="excerpt" rows={4} defaultValue={defaults?.excerpt} />
        <TextArea label="Context" name="context" rows={5} defaultValue={defaults?.context} />
        <TextArea label="Problem" name="problem" rows={5} defaultValue={defaults?.problem} />
        <TextArea
          label="Constraints"
          name="constraints"
          rows={5}
          defaultValue={defaults?.constraints}
        />
        <TextArea label="What I Did" name="action" rows={6} defaultValue={defaults?.action} />
        <TextArea label="Trade-offs" name="tradeoffs" rows={5} defaultValue={defaults?.tradeoffs} />
        <TextArea label="Outcome" name="outcome" rows={5} defaultValue={defaults?.outcome} />
        <TextArea
          label="What I Learned"
          name="learning"
          rows={5}
          defaultValue={defaults?.learning}
        />
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
        <SeoFields defaults={defaults} />
        <SubmitButton label={submitLabel} />
      </div>
    </ConfirmedForm>
  );
}
