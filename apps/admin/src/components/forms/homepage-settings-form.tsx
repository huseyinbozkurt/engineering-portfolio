import type {
  CaseStudyRecord,
  ExperienceRecord,
  HomepageSettingsRecord,
  PrincipleRecord,
  SiteSettingsWithLogoRecord,
  SkillRecord,
} from "@portfolio/db/queries";
import { Pencil } from "lucide-react";

import { ConfirmedForm } from "@/components/confirmed-form";
import { Checkbox, Field, SelectField } from "@/components/form-controls";
import { BrandLogoUpload } from "@/components/forms/brand-logo-upload";
import { CollectionEditor } from "@/components/forms/collection-editor";
import { MetricCardsEditor } from "@/components/forms/metric-cards-editor";
import { RichTextField } from "@/components/forms/rich-text-field";
import { SearchablePicker } from "@/components/forms/searchable-picker";
import { SaveBar } from "@/components/save-bar";

import type { FormAction } from "./types";

interface HomepageSettingsFormProps {
  action: FormAction;
  defaults?: HomepageSettingsRecord | null | undefined;
  siteSettings?: SiteSettingsWithLogoRecord | null | undefined;
  skills: SkillRecord[];
  principles: PrincipleRecord[];
  caseStudies: CaseStudyRecord[];
  experiences: ExperienceRecord[];
}

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const sections = [
  { id: "brand", label: "Brand" },
  { id: "hero", label: "Hero" },
  { id: "code", label: "Code panel" },
  { id: "metrics", label: "Metric cards" },
  { id: "featured", label: "Featured content" },
] as const;

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "HB";
}

function plainBrandName(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^[\s-]*[-*]\s+/gm, "")
    .replace(/[`*_~>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function adminSiteImageUrl(imageId: string | null | undefined): string | null {
  return imageId ? `/api/site-images/${imageId}` : null;
}

function EditableSectionLabel({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-100">
      <Pencil className="size-3" aria-hidden />
      {children}
    </span>
  );
}

/**
 * Homepage builder. Mirrors the public homepage composition with inline-style
 * controls while keeping the original field names and serialization contract for
 * `upsertHomepageSettingsAction`.
 */
export function HomepageSettingsForm({
  action,
  defaults,
  siteSettings,
  skills,
  principles,
  caseStudies,
  experiences,
}: HomepageSettingsFormProps) {
  const brandName = siteSettings?.brandName ?? "Huseyin Bozkurt";
  const brandLogoSize = siteSettings?.brandLogoSize ?? 28;
  const brandLogoImageId = siteSettings?.brandLogoImageId ?? null;
  const brandLogoUrl = siteSettings?.brandLogoImage
    ? adminSiteImageUrl(brandLogoImageId)
    : null;
  const fallbackInitials = getInitials(plainBrandName(brandName));
  const metricDefaults = defaults?.metricCards ?? [];

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

        <div className="mt-6 max-w-7xl overflow-hidden rounded-lg border border-line bg-[#050914] shadow-card">
          <section
            id="brand"
            className="scroll-mt-24 border-b border-line bg-white/[0.025] px-5 py-4 lg:px-8"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <EditableSectionLabel>Brand</EditableSectionLabel>
              <p className="text-xs text-muted">Used by the public navbar.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.55fr)] lg:items-start">
              <div className="flex min-w-0 items-center justify-between gap-4 rounded-lg border border-line bg-surface/60 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BrandLogoUpload
                    currentLogoUrl={brandLogoUrl}
                    currentFilename={siteSettings?.brandLogoImage?.filename}
                    currentSizeBytes={siteSettings?.brandLogoImage?.sizeBytes}
                    currentLogoImageId={brandLogoImageId}
                    fallbackInitials={fallbackInitials}
                    logoSize={brandLogoSize}
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <RichTextField
                  label="Brand name"
                  name="brandName"
                  placeholder="Huseyin Bozkurt"
                  defaultValue={brandName}
                  rows={3}
                  variant="inline"
                  hint="Markdown styling is supported. Keep it short for the navbar."
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                  <Checkbox
                    label="Show brand name in navbar"
                    name="showBrandName"
                    defaultChecked={siteSettings?.showBrandName ?? true}
                  />
                  <Field
                    label="Logo size"
                    name="brandLogoSize"
                    type="number"
                    placeholder="28"
                    defaultValue={String(brandLogoSize)}
                    min={16}
                    max={96}
                    step={1}
                    hint="16 to 96 px"
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            id="hero"
            className="scroll-mt-24 border-b border-line px-5 py-10 lg:px-8 lg:py-14"
          >
            <div className="mb-6">
              <EditableSectionLabel>Hero</EditableSectionLabel>
            </div>
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="grid content-start gap-5">
                <input
                  className="w-full border-0 bg-transparent p-0 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300 outline-none ring-0 placeholder:text-violet-300/45 focus:ring-0"
                  name="roleLabel"
                  placeholder="Senior Software Engineer"
                  defaultValue={defaults?.roleLabel ?? undefined}
                />
                <textarea
                  className="min-h-40 w-full resize-y border-0 bg-transparent p-0 text-4xl font-semibold leading-tight text-ink outline-none ring-0 placeholder:text-ink/25 focus:ring-0 sm:text-5xl"
                  name="headline"
                  rows={3}
                  placeholder="I build software, improve systems, and help teams deliver with confidence."
                  defaultValue={defaults?.headline ?? undefined}
                />
                <Field
                  label="Highlighted phrase"
                  name="headlineHighlight"
                  placeholder="deliver with confidence."
                  defaultValue={defaults?.headlineHighlight ?? undefined}
                  hint="This exact phrase is accented in the public headline."
                />
                <textarea
                  className="min-h-28 w-full resize-y rounded-lg border border-line bg-white/[0.025] px-4 py-3 text-lg leading-8 text-muted outline-none transition placeholder:text-muted/45 focus:border-accent-400/50 focus:ring-2 focus:ring-accent-500/20"
                  name="summary"
                  rows={4}
                  placeholder="Short intro shown below the headline."
                  defaultValue={defaults?.summary ?? undefined}
                />
                <div className="grid gap-3 sm:grid-cols-2">
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
              </div>

              <div
                id="code"
                className="scroll-mt-24 rounded-lg border border-line bg-[#080d1a] p-5 font-mono text-xs leading-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <EditableSectionLabel>Code</EditableSectionLabel>
                  <span className="text-muted/70">{">_"}</span>
                </div>
                <p className="text-violet-300">
                  <span aria-hidden>{">"}</span> const engineer = {"{"}
                </p>
                <label className="mt-2 grid gap-1 pl-4 text-sky-200">
                  <span>role:</span>
                  <input
                    className="ui-input font-sans"
                    name="codeRoleLabel"
                    placeholder="Senior Software Engineer"
                    defaultValue={defaults?.codeRoleLabel ?? undefined}
                  />
                </label>
                <div className="mt-3 pl-4">
                  <CollectionEditor
                    name="codeFocusItems"
                    label="focus"
                    defaultItems={defaults?.codeFocusItems ?? []}
                    max={8}
                    maxLength={180}
                    placeholder="Solving real problems"
                    addLabel="Add focus item"
                  />
                </div>
                <div className="mt-4 grid gap-3 pl-4">
                  <Field
                    label="Mindset"
                    name="codeMindsetLabel"
                    placeholder="Owner. Builder. Problem Solver."
                    defaultValue={defaults?.codeMindsetLabel ?? undefined}
                  />
                  <Field
                    label="Location"
                    name="codeLocationLabel"
                    placeholder="Toronto, Canada"
                    defaultValue={defaults?.codeLocationLabel ?? undefined}
                  />
                  <Field
                    label="Experience"
                    name="codeExperienceLabel"
                    placeholder="7+ years"
                    defaultValue={defaults?.codeExperienceLabel ?? undefined}
                  />
                </div>
                <p className="mt-4 text-violet-300">{"}"}</p>
              </div>
            </div>
          </section>

          <section
            id="metrics"
            className="scroll-mt-24 border-b border-line px-5 py-10 lg:px-8"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <EditableSectionLabel>Metrics</EditableSectionLabel>
                <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">
                  Homepage Metrics
                </h2>
              </div>
              <span className="text-xs tabular-nums text-muted/70">
                {metricDefaults.length}/6 configured
              </span>
            </div>
            <MetricCardsEditor name="metricCards" defaultMetrics={metricDefaults} />
          </section>

          <section
            id="featured"
            className="scroll-mt-24 px-5 py-10 lg:px-8"
          >
            <div className="mb-6">
              <EditableSectionLabel>Featured</EditableSectionLabel>
              <h2 className="mt-3 text-2xl font-semibold text-ink md:text-3xl">
                Selected Impact Stories
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
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
            </div>
          </section>
        </div>
      </div>
    </ConfirmedForm>
  );
}
