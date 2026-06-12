import { z } from "zod";

export * from "./insights";
export * from "./resume";
export * from "./stories";

export const contentStatusSchema = z.enum(["draft", "published", "archived"]);

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");

export const titleSchema = z.string().trim().min(1).max(220);
export const summarySchema = z.string().trim().max(5000).default("");
export const richTextSchema = z.string().trim().max(30000).default("");
export const uuidSchema = z.string().uuid();
export const relationIdsSchema = z.array(uuidSchema).default([]);

const emptyStringToNull = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const nullableTextSchema = z.preprocess(
  emptyStringToNull,
  z.string().max(2048).nullable().default(null),
);

export const nullableUrlSchema = z.preprocess(
  emptyStringToNull,
  z.string().url().nullable().default(null),
);

/** Optional single relation id — an empty selection submits "" and stores null. */
export const nullableUuidSchema = z.preprocess(
  emptyStringToNull,
  uuidSchema.nullable().default(null),
);

export const nullableEmailSchema = z.preprocess(
  emptyStringToNull,
  z.string().trim().email("Enter a valid email address.").max(320).nullable().default(null),
);

export const nullableDateSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .nullable()
    .default(null),
);

export const nullableSlugSchema = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.")
    .nullable()
    .default(null),
);

/** Optional SEO / Open Graph overrides shared by publicly addressable content. */
export const seoFields = {
  seoTitle: nullableTextSchema,
  seoDescription: nullableTextSchema,
  ogImage: nullableTextSchema,
};

export const createLensSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(160),
  summary: summarySchema,
  accentColor: z.string().trim().min(4).max(32).default("#7dd3fc"),
  status: contentStatusSchema.default("draft"),
  ...seoFields,
  position: z.coerce.number().int().default(0),
});

export const createPrincipleSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  summary: summarySchema,
  body: richTextSchema,
  status: contentStatusSchema.default("draft"),
  ...seoFields,
  position: z.coerce.number().int().default(0),
});

export const createDecisionPatternSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  summary: summarySchema,
  body: richTextSchema,
  status: contentStatusSchema.default("draft"),
  ...seoFields,
  principleIds: relationIdsSchema,
  position: z.coerce.number().int().default(0),
});

export const createExperienceSchema = z.object({
  slug: nullableSlugSchema,
  company: z.string().trim().max(180).default(""),
  role: z.string().trim().max(180).default(""),
  location: nullableTextSchema,
  startDate: nullableDateSchema,
  endDate: nullableDateSchema,
  isCurrent: z.coerce.boolean().default(false),
  summary: richTextSchema,
  details: richTextSchema,
  // Short "Awards & Recognition" briefs, one per line (only first 3 shown).
  awards: z.string().trim().max(2000).default(""),
  status: contentStatusSchema.default("draft"),
  ...seoFields,
  lensIds: relationIdsSchema,
  principleIds: relationIdsSchema,
  skillIds: relationIdsSchema,
  tagIds: relationIdsSchema,
  position: z.coerce.number().int().default(0),
});

export const createProjectSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().max(180).default(""),
  description: richTextSchema,
  details: richTextSchema,
  architecture: richTextSchema,
  developmentTechStack: richTextSchema,
  qaTechStack: richTextSchema,
  aiIntegrationTechStack: richTextSchema,
  deploymentTechStack: richTextSchema,
  status: contentStatusSchema.default("draft"),
  url: nullableUrlSchema,
  githubUrl: nullableUrlSchema,
  startDate: nullableDateSchema,
  endDate: nullableDateSchema,
  ...seoFields,
  experienceId: nullableUuidSchema,
  lensIds: relationIdsSchema,
  principleIds: relationIdsSchema,
  skillIds: relationIdsSchema,
  tagIds: relationIdsSchema,
  position: z.coerce.number().int().default(0),
});

export const createCaseStudySchema = z.object({
  slug: slugSchema,
  title: z.string().trim().max(220).default(""),
  excerpt: summarySchema,
  status: contentStatusSchema.default("draft"),
  ...seoFields,
  context: richTextSchema,
  problem: richTextSchema,
  constraints: richTextSchema,
  action: richTextSchema,
  tradeoffs: richTextSchema,
  outcome: richTextSchema,
  learning: richTextSchema,
  lensIds: relationIdsSchema,
  principleIds: relationIdsSchema,
  experienceIds: relationIdsSchema,
  projectIds: relationIdsSchema,
  skillIds: relationIdsSchema,
  tagIds: relationIdsSchema,
  position: z.coerce.number().int().default(0),
});

export const createSkillSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(140),
  category: nullableTextSchema,
  summary: summarySchema,
  status: contentStatusSchema.default("draft"),
  position: z.coerce.number().int().default(0),
});

export const createTagSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(140),
  category: nullableTextSchema,
  status: contentStatusSchema.default("draft"),
});

export const createContactSubmissionSchema = z
  .object({
    intent: z
      .enum([
        "hiring",
        "technicalConsultation",
        "architecture",
        "aiAutomation",
        "frontendProduct",
        "collaboration",
        "buildProduct",
        "improveProcess",
        "technicalLeadership",
        "exploreAI",
        "deliveryIssues",
        'other'
      ])
      .default("collaboration"),
    name: z.string().trim().min(1, "Name is required.").max(160),
    email: nullableEmailSchema,
    wantsResponse: z.coerce.boolean().default(false),
    company: nullableTextSchema,
    roleTitle: nullableTextSchema,
    techStack: nullableTextSchema,
    problem: z.string().trim().min(1, "Problem is required.").max(5000),
    desiredOutcome: nullableTextSchema,
    timeline: nullableTextSchema,
    message: z.string().trim().min(1, "Message is required.").max(5000),
  })
  .superRefine((value, context) => {
    if (value.wantsResponse && !value.email) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email is required when you want a response.",
        path: ["email"],
      });
    }
  });

export const contactProfileSchema = z.object({
  locationLabel: nullableTextSchema,
  availabilityLabel: nullableTextSchema,
  timezoneLabel: nullableTextSchema,
  responseTimeLabel: nullableTextSchema,
  linkedinUrl: nullableUrlSchema,
  githubUrl: nullableUrlSchema,
  emailAddress: nullableEmailSchema,
  resumeUrl: nullableUrlSchema,
  shortContactIntro: nullableTextSchema,
  openToItems: z
    .array(z.string().trim().min(1).max(160))
    .max(12, "Add no more than 12 open-to items.")
    .default([]),
});

export const homepageMetricSchema = z.object({
  value: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(180).optional(),
});

export const homepageSettingsSchema = z.object({
  roleLabel: nullableTextSchema,
  headline: nullableTextSchema,
  headlineHighlight: nullableTextSchema,
  summary: nullableTextSchema,
  primaryCtaLabel: nullableTextSchema,
  primaryCtaHref: nullableTextSchema,
  secondaryCtaLabel: nullableTextSchema,
  secondaryCtaHref: nullableTextSchema,
  codeRoleLabel: nullableTextSchema,
  codeMindsetLabel: nullableTextSchema,
  codeLocationLabel: nullableTextSchema,
  codeExperienceLabel: nullableTextSchema,
  codeFocusItems: z.array(z.string().trim().min(1).max(180)).max(8).default([]),
  metricCards: z.array(homepageMetricSchema).max(6).default([]),
  featuredSkillIds: relationIdsSchema,
  featuredPrincipleIds: relationIdsSchema,
  featuredCaseStudyIds: relationIdsSchema,
  featuredRecognitionExperienceId: nullableUuidSchema,
});

export const bulkSkillsSchema = z.object({
  items: z.array(createSkillSchema).min(1, "Add at least one skill."),
});

export const bulkTagsSchema = z.object({
  items: z.array(createTagSchema).min(1, "Add at least one tag."),
});

export const experienceAiReviewOutputSchema = z
  .object({
    qualityScore: z.number().int().min(0).max(100),
    summary: z.string().trim().min(1).max(1000),
    strengths: z.array(z.string().trim().min(1).max(300)).max(8),
    issues: z.array(z.string().trim().min(1).max(300)).max(8),
    suggestions: z.array(z.string().trim().min(1).max(300)).max(8),
  })
  .strict();

export type ExperienceAiReviewOutput = z.infer<typeof experienceAiReviewOutputSchema>;

export type CreateLensInput = z.infer<typeof createLensSchema>;
export type CreatePrincipleInput = z.infer<typeof createPrincipleSchema>;
export type CreateDecisionPatternInput = z.infer<typeof createDecisionPatternSchema>;
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateCaseStudyInput = z.infer<typeof createCaseStudySchema>;
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type CreateContactSubmissionInput = z.infer<typeof createContactSubmissionSchema>;
export type ContactIntent = CreateContactSubmissionInput["intent"];
export type ContactSubmission = CreateContactSubmissionInput;
export type ContactProfile = z.infer<typeof contactProfileSchema>;
export type HomepageSettings = z.infer<typeof homepageSettingsSchema>;
export type HomepageMetric = z.infer<typeof homepageMetricSchema>;
export type BulkSkillsInput = z.infer<typeof bulkSkillsSchema>;
export type BulkTagsInput = z.infer<typeof bulkTagsSchema>;

// Update schemas reuse the create shape and add the target record id. Relation
// id arrays are kept so an update fully replaces the record's relationships.
export const updateLensSchema = createLensSchema.extend({ id: uuidSchema });
export const updatePrincipleSchema = createPrincipleSchema.extend({ id: uuidSchema });
export const updateDecisionPatternSchema = createDecisionPatternSchema.extend({ id: uuidSchema });
export const updateExperienceSchema = createExperienceSchema.extend({ id: uuidSchema });
export const updateProjectSchema = createProjectSchema.extend({ id: uuidSchema });
export const updateCaseStudySchema = createCaseStudySchema.extend({ id: uuidSchema });
export const updateSkillSchema = createSkillSchema.extend({ id: uuidSchema });
export const updateTagSchema = createTagSchema.extend({ id: uuidSchema });

export type UpdateLensInput = z.infer<typeof updateLensSchema>;
export type UpdatePrincipleInput = z.infer<typeof updatePrincipleSchema>;
export type UpdateDecisionPatternInput = z.infer<typeof updateDecisionPatternSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateCaseStudyInput = z.infer<typeof updateCaseStudySchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;

// Patch schemas power per-section ("inline") editing in the admin: every field
// is optional, so a section form can submit just the fields it owns (plus the
// id) and leave everything else untouched. The admin action layer reads a
// `__fields` manifest to decide which keys to validate and apply, and relation
// arrays are only re-written when their key is among the declared fields.
export const patchLensSchema = createLensSchema.partial().extend({ id: uuidSchema });
export const patchPrincipleSchema = createPrincipleSchema.partial().extend({ id: uuidSchema });
export const patchDecisionPatternSchema = createDecisionPatternSchema
  .partial()
  .extend({ id: uuidSchema });
export const patchExperienceSchema = createExperienceSchema.partial().extend({ id: uuidSchema });
export const patchProjectSchema = createProjectSchema.partial().extend({ id: uuidSchema });
export const patchCaseStudySchema = createCaseStudySchema.partial().extend({ id: uuidSchema });
export const patchSkillSchema = createSkillSchema.partial().extend({ id: uuidSchema });
export const patchTagSchema = createTagSchema.partial().extend({ id: uuidSchema });

export type PatchLensInput = z.infer<typeof patchLensSchema>;
export type PatchPrincipleInput = z.infer<typeof patchPrincipleSchema>;
export type PatchDecisionPatternInput = z.infer<typeof patchDecisionPatternSchema>;
export type PatchExperienceInput = z.infer<typeof patchExperienceSchema>;
export type PatchProjectInput = z.infer<typeof patchProjectSchema>;
export type PatchCaseStudyInput = z.infer<typeof patchCaseStudySchema>;
export type PatchSkillInput = z.infer<typeof patchSkillSchema>;
export type PatchTagInput = z.infer<typeof patchTagSchema>;

/** Minimal schema for actions that only need a record id (e.g. delete). */
export const idInputSchema = z.object({ id: uuidSchema });
export type IdInput = z.infer<typeof idInputSchema>;
