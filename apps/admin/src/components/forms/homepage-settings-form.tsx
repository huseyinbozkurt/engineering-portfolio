import type {
  CaseStudyRecord,
  ExperienceRecord,
  HomepageSettingsRecord,
  PrincipleRecord,
  SkillRecord,
} from "@portfolio/db/queries";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Field, SelectField, TextArea } from "@/components/form-controls";
import { CollectionEditor } from "@/components/forms/collection-editor";
import { FormSection } from "@/components/forms/form-section";
import { MetricCardsEditor } from "@/components/forms/metric-cards-editor";
import { SearchablePicker } from "@/components/forms/searchable-picker";
import { SaveBar } from "@/components/save-bar";

import type { FormAction } from "./types";

interface HomepageSettingsFormProps {
  action: FormAction;
  defaults?: HomepageSettingsRecord | null | undefined;
  skills: SkillRecord[];
  principles: PrincipleRecord[];
  caseStudies: CaseStudyRecord[];
  experiences: ExperienceRecord[];
}

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const sections = [
  { id: "hero", label: "Hero" },
  { id: "code", label: "Code panel" },
  { id: "metrics", label: "Metric cards" },
  { id: "featured", label: "Featured content" },
] as const;

/**
 * Homepage builder. Splits the public homepage configuration into focused,
 * card-based sections with a sticky save bar, anchored section nav, and visual
 * editors for metrics and featured content. Every field name and serialization
 * matches the original form, so `upsertHomepageSettingsAction` /
 * `homepageSettingsSchema` are unchanged.
 */
export function HomepageSettingsForm({
  action,
  defaults,
  skills,
  principles,
  caseStudies,
  experiences,
}: HomepageSettingsFormProps) {
  return (
    <ConfirmedForm action={action} confirm="off" trackDirty className="min-w-0">
      <SaveBar title="Homepage" previewHref={PUBLIC_SITE_URL} saveLabel="Save homepage" />

      <div className="px-5 pb-24 pt-5 lg:px-8">
        <nav aria-label="Sections" className="flex flex-wrap gap-1.5">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-lg border border-line bg-white/[0.02] px-3 py-1.5 text-sm text-muted transition hover:border-accent-400/40 hover:text-ink"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="mt-6 grid max-w-4xl gap-6">
          <FormSection
            id="hero"
            title="Hero"
            description="Headline, intro, and the two calls to action at the top of the homepage."
          >
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
            <Field
              label="Headline highlight"
              name="headlineHighlight"
              placeholder="deliver with confidence."
              defaultValue={defaults?.headlineHighlight ?? undefined}
              hint="Optional — this exact phrase inside the headline renders in the accent gradient."
            />
            <TextArea
              label="Summary"
              name="summary"
              rows={4}
              placeholder="Short intro shown below the headline."
              defaultValue={defaults?.summary ?? undefined}
            />
            <div className="grid gap-4 rounded-xl border border-line bg-white/[0.015] p-4 md:grid-cols-2">
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
          </FormSection>

          <FormSection
            id="code"
            title="Code panel"
            description="The terminal-style identity card and its focus list."
          >
            <div className="grid gap-4 md:grid-cols-2">
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
            <CollectionEditor
              name="codeFocusItems"
              label="Code focus items"
              defaultItems={defaults?.codeFocusItems ?? []}
              max={8}
              maxLength={180}
              placeholder="Solving real problems"
              hint="Short focus statements listed in the code panel."
              addLabel="Add focus item"
            />
          </FormSection>

          <FormSection
            id="metrics"
            title="Metric cards"
            description="Up to six headline stats highlighted on the homepage."
          >
            <MetricCardsEditor name="metricCards" defaultMetrics={defaults?.metricCards ?? []} />
          </FormSection>

          <FormSection
            id="featured"
            title="Featured content"
            description="Pick the records surfaced on the homepage. Search to add; remove with ×."
          >
            <SearchablePicker
              name="featuredSkillIds"
              label="Hero skill chips"
              options={skills.map((skill) => ({
                id: skill.id,
                label: skill.name,
                hint: skill.category,
              }))}
              defaultSelectedIds={defaults?.featuredSkillIds}
              emptyLabel="No skills available."
            />
            <SearchablePicker
              name="featuredPrincipleIds"
              label="Operating principles"
              options={principles.map((principle) => ({
                id: principle.id,
                label: principle.title,
              }))}
              defaultSelectedIds={defaults?.featuredPrincipleIds}
              emptyLabel="No principles available."
            />
            <SearchablePicker
              name="featuredCaseStudyIds"
              label="Selected impact stories"
              options={caseStudies.map((caseStudy) => ({
                id: caseStudy.id,
                label: caseStudy.title,
              }))}
              defaultSelectedIds={defaults?.featuredCaseStudyIds}
              emptyLabel="No case studies available."
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
          </FormSection>
        </div>
      </div>
    </ConfirmedForm>
  );
}
