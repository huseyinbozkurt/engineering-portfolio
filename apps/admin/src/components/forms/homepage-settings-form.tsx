import type {
  CaseStudyRecord,
  ExperienceRecord,
  HomepageSettingsRecord,
  PrincipleRecord,
  SkillRecord,
} from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import {
  CheckboxGroup,
  Field,
  SelectField,
  SubmitButton,
  TextArea,
} from "@/components/form-controls";

import type { FormAction } from "./types";

interface HomepageSettingsFormProps {
  action: FormAction;
  defaults?: HomepageSettingsRecord | null | undefined;
  skills: SkillRecord[];
  principles: PrincipleRecord[];
  caseStudies: CaseStudyRecord[];
  experiences: ExperienceRecord[];
}

export function HomepageSettingsForm({
  action,
  defaults,
  skills,
  principles,
  caseStudies,
  experiences,
}: HomepageSettingsFormProps) {
  return (
    <ConfirmedForm
      action={action}
      className="grid min-w-0 gap-5"
      confirmation={{
        title: "Save homepage settings?",
        description: "This updates the public homepage configuration.",
        confirmLabel: "Save homepage settings",
      }}
    >
      <section className="grid min-w-0 gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
        <h2 className="text-lg font-semibold text-ink">Hero</h2>
        <Field
          label="Role label"
          name="roleLabel"
          placeholder="Senior Software Engineer"
          defaultValue={defaults?.roleLabel ?? undefined}
        />
        <TextArea
          label="Headline"
          name="headline"
          rows={3}
          placeholder="I build software, improve systems, and help teams deliver with confidence."
          defaultValue={defaults?.headline ?? undefined}
        />
        <div className="grid gap-1.5">
          <Field
            label="Headline highlight"
            name="headlineHighlight"
            placeholder="deliver with confidence."
            defaultValue={defaults?.headlineHighlight ?? undefined}
          />
          <p className="text-xs leading-5 text-muted">
            Optional — this exact phrase inside the headline is rendered in the accent gradient.
          </p>
        </div>
        <TextArea
          label="Summary"
          name="summary"
          rows={4}
          placeholder="Short intro shown below the headline."
          defaultValue={defaults?.summary ?? undefined}
        />
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <Field
            label="Primary CTA label"
            name="primaryCtaLabel"
            placeholder="View Experience"
            defaultValue={defaults?.primaryCtaLabel ?? undefined}
          />
          <Field
            label="Primary CTA href"
            name="primaryCtaHref"
            placeholder="/experience"
            defaultValue={defaults?.primaryCtaHref ?? undefined}
          />
          <Field
            label="Secondary CTA label"
            name="secondaryCtaLabel"
            placeholder="Explore Case Studies"
            defaultValue={defaults?.secondaryCtaLabel ?? undefined}
          />
          <Field
            label="Secondary CTA href"
            name="secondaryCtaHref"
            placeholder="/case-studies"
            defaultValue={defaults?.secondaryCtaHref ?? undefined}
          />
        </div>
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
        <h2 className="text-lg font-semibold text-ink">Code panel</h2>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <Field
            label="Code role"
            name="codeRoleLabel"
            placeholder="Senior Software Engineer"
            defaultValue={defaults?.codeRoleLabel ?? undefined}
          />
          <Field
            label="Code mindset"
            name="codeMindsetLabel"
            placeholder="Owner. Builder. Problem Solver."
            defaultValue={defaults?.codeMindsetLabel ?? undefined}
          />
          <Field
            label="Code location"
            name="codeLocationLabel"
            placeholder="Toronto, Canada"
            defaultValue={defaults?.codeLocationLabel ?? undefined}
          />
          <Field
            label="Code experience"
            name="codeExperienceLabel"
            placeholder="7+ years"
            defaultValue={defaults?.codeExperienceLabel ?? undefined}
          />
        </div>
        <TextArea
          label="Code focus items"
          name="codeFocusItems"
          rows={5}
          placeholder={"Solving real problems\nImproving engineering systems\nBuilding maintainable solutions"}
          defaultValue={(defaults?.codeFocusItems ?? []).join("\n")}
        />
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
        <h2 className="text-lg font-semibold text-ink">Metric cards</h2>
        <TextArea
          label="Metrics"
          name="metricCards"
          rows={7}
          placeholder={"35% -> 85% | Release Success Improvement\n20+ | Mobile Apps Delivered\n2024 | Excellent Engineer Award"}
          defaultValue={formatMetricRows(defaults)}
        />
        <p className="text-xs leading-5 text-muted">
          Use one metric per line: value | label | optional detail. Keep values brief.
        </p>
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
        <h2 className="text-lg font-semibold text-ink">Featured content</h2>
        <CheckboxGroup
          label="Hero skill chips"
          name="featuredSkillIds"
          emptyLabel="No skills available."
          options={skills.map((skill) => ({
            id: skill.id,
            label: skill.name,
            category: skill.category,
          }))}
          selectedIds={defaults?.featuredSkillIds}
        />
        <CheckboxGroup
          label="Operating principles"
          name="featuredPrincipleIds"
          emptyLabel="No principles available."
          options={principles.map((principle) => ({
            id: principle.id,
            label: principle.title,
          }))}
          selectedIds={defaults?.featuredPrincipleIds}
        />
        <CheckboxGroup
          label="Selected impact stories"
          name="featuredCaseStudyIds"
          emptyLabel="No case studies available."
          options={caseStudies.map((caseStudy) => ({
            id: caseStudy.id,
            label: caseStudy.title,
          }))}
          selectedIds={defaults?.featuredCaseStudyIds}
        />
        <SelectField
          label="Recognition source"
          name="featuredRecognitionExperienceId"
          defaultValue={defaults?.featuredRecognitionExperienceId ?? ""}
          options={[
            { label: "Automatic from published awards", value: "" },
            ...experiences.map((experience) => ({
              label: `${experience.role} at ${experience.company}`,
              value: experience.id,
            })),
          ]}
        />
      </section>

      <SubmitButton label="Save homepage settings" />
    </ConfirmedForm>
  );
}

function formatMetricRows(defaults?: HomepageSettingsRecord | null | undefined): string {
  return (defaults?.metricCards ?? [])
    .map((metric) => [metric.value, metric.label, metric.detail].filter(Boolean).join(" | "))
    .join("\n");
}
