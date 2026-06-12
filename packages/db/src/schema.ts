import { relations, sql } from "drizzle-orm";
import type {
  AiGeneratedStoryPayload,
  PortfolioVisibility,
  ProjectConfidentiality,
  ProjectContribution,
  ProjectDecision,
  ProjectEngineeringSignals,
  ProjectEvidence,
  ProjectMetric,
  ProjectOutcome,
  ProjectOwnership,
  ProjectRole,
  ReleaseStatus,
  ProjectSignals,
  ProjectStatus,
  ProjectType,
  SourceAvailability,
} from "@portfolio/validators";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** Postgres bytea for small binary payloads (e.g. the uploaded resume). */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];

export const llmTaskStatusEnum = pgEnum("llm_task_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
]);

export type LlmTaskStatus = (typeof llmTaskStatusEnum.enumValues)[number];

export const aiGeneratedStoryStatusEnum = pgEnum("ai_generated_story_status", [
  "draft",
  "applied",
  "failed",
]);

export type AiGeneratedStoryStatus = (typeof aiGeneratedStoryStatusEnum.enumValues)[number];

export const aiReviewStatusEnum = pgEnum("ai_review_status", [
  "idle",
  "queued",
  "processing",
  "completed",
  "failed",
]);

export type AiReviewStatus = (typeof aiReviewStatusEnum.enumValues)[number];

/**
 * Shape for AI-generated content review suggestions. Stored as jsonb so the
 * structure can evolve without a migration as more content types get reviews.
 */
export interface AiSuggestion {
  field: string;
  suggestion: string;
}

export interface HomepageMetric {
  value: string;
  label: string;
  detail?: string | undefined;
}

/**
 * Editorial workflow columns shared by every content-like entity. `status`
 * drives the publishing workflow (only "published" can be shown publicly);
 * project portfolio visibility is modeled separately on projects. The two
 * timestamps record when a record entered the published/archived state.
 */
const workflow = {
  status: contentStatusEnum("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
};

/** Optional SEO / Open Graph overrides for publicly addressable content. */
const seo = {
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ogImage: text("og_image"),
};

/** AI-assist metadata populated by content review tasks; null until reviewed. */
const aiMetadata = {
  contentQualityScore: integer("content_quality_score"),
  lastAiReviewAt: timestamp("last_ai_review_at", { withTimezone: true }),
  aiSummary: text("ai_summary"),
  aiSuggestions: jsonb("ai_suggestions").$type<AiSuggestion[]>(),
  aiReviewStatus: aiReviewStatusEnum("ai_review_status").notNull().default("idle"),
  aiReviewError: text("ai_review_error"),
};

export const lenses = pgTable(
  "lenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    summary: text("summary").notNull().default(""),
    accentColor: varchar("accent_color", { length: 32 }).notNull().default("#7dd3fc"),
    ...workflow,
    ...seo,
    ...aiMetadata,
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("lenses_slug_idx").on(table.slug),
    index("lenses_status_idx").on(table.status),
    index("lenses_position_idx").on(table.position),
  ]
);

export const principles = pgTable(
  "principles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    ...workflow,
    ...seo,
    ...aiMetadata,
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("principles_slug_idx").on(table.slug),
    index("principles_status_idx").on(table.status),
    index("principles_position_idx").on(table.position),
  ]
);

export const decisionPatterns = pgTable(
  "decision_patterns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    ...workflow,
    ...seo,
    ...aiMetadata,
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("decision_patterns_slug_idx").on(table.slug),
    index("decision_patterns_status_idx").on(table.status),
    index("decision_patterns_position_idx").on(table.position),
  ],
);

export const experiences = pgTable(
  "experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }),
    company: varchar("company", { length: 180 }).notNull(),
    role: varchar("role", { length: 180 }).notNull(),
    location: varchar("location", { length: 160 }),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    isCurrent: boolean("is_current").notNull().default(false),
    summary: text("summary").notNull().default(""),
    // Long-form rich text (markdown) shown on the experience detail page.
    details: text("details").notNull().default(""),
    // Short "Awards & Recognition" briefs (employer feedback or rewards), one
    // per line. Only the first 3 are displayed, top-right on the detail page.
    awards: text("awards").notNull().default(""),
    ...workflow,
    ...seo,
    ...aiMetadata,
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("experiences_slug_idx").on(table.slug),
    index("experiences_status_idx").on(table.status),
    index("experiences_date_idx").on(table.startDate, table.endDate),
    index("experiences_position_idx").on(table.position),
  ],
);

export const projects = pgTable("projects",{
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description").notNull().default(""),
    // Long-form rich text (markdown) shown on the project detail page.
    details: text("details").notNull().default(""),
    // Optional architecture content shown as a dedicated detail section.
    architecture: text("architecture").notNull().default(""),
    developmentTechStack: text("development_tech_stack").notNull().default(""),
    qaTechStack: text("qa_tech_stack").notNull().default(""),
    aiIntegrationTechStack: text("ai_integration_tech_stack").notNull().default(""),
    deploymentTechStack: text("deployment_tech_stack").notNull().default(""),
    url: text("url"),
    githubUrl: text("github_url"),
    portfolioVisibility: varchar("portfolio_visibility", { length: 20 })
      .$type<PortfolioVisibility>()
      .notNull()
      .default("public"),
    featured: boolean("featured").notNull().default(false),
    projectType: varchar("project_type", { length: 40 })
      .$type<ProjectType>()
      .notNull()
      .default("product"),
    projectStatus: varchar("project_status", { length: 40 })
      .$type<ProjectStatus>()
      .notNull()
      .default("completed"),
    projectRole: varchar("project_role", { length: 40 })
      .$type<ProjectRole>()
      .notNull()
      .default("solo-builder"),
    confidentiality: varchar("confidentiality", { length: 40 })
      .$type<ProjectConfidentiality>()
      .notNull()
      .default("none"),
    ownership: varchar("ownership", { length: 40 })
      .$type<ProjectOwnership>()
      .notNull()
      .default("end-to-end-owner"),
    teamSize: integer("team_size"),
    durationMonths: integer("duration_months"),
    motivation: text("motivation").notNull().default(""),
    problem: text("problem").notNull().default(""),
    constraints: jsonb("constraints").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    tradeOffs: jsonb("trade_offs").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    whatILearned: jsonb("what_i_learned").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    contributions: jsonb("contributions")
      .$type<ProjectContribution[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    decisions: jsonb("decisions")
      .$type<ProjectDecision[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    outcomes: jsonb("outcomes")
      .$type<ProjectOutcome[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    metrics: jsonb("metrics")
      .$type<ProjectMetric[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    evidence: jsonb("evidence")
      .$type<ProjectEvidence[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    engineeringSignals: jsonb("engineering_signals")
      .$type<ProjectEngineeringSignals>()
      .notNull()
      .default(
        sql`'{"testing":"none","ciCd":"none","observability":"none","documentation":"none","security":"none","infrastructure":"none","aiIntegration":"none"}'::jsonb`,
      ),
    projectSignals: jsonb("project_signals")
      .$type<ProjectSignals>()
      .notNull()
      .default(
        sql`'{"complexity":3,"ambiguity":3,"ownership":3,"crossFunctionality":3,"operationalResponsibility":3,"innovation":3}'::jsonb`,
      ),
    sourceAvailability: varchar("source_availability", { length: 30 })
      .$type<SourceAvailability>()
      .notNull()
      .default("closed-source"),
    repositoryUrl: text("repository_url"),
    releaseStatus: varchar("release_status", { length: 30 })
      .$type<ReleaseStatus>()
      .notNull()
      .default("in-development"),
    demoUrl: text("demo_url"),
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    // Optional "position" a project was built during. Nullable: a project need
    // not belong to an experience, and removing the experience just unlinks it.
    experienceId: uuid("experience_id").references(() => experiences.id, {
      onDelete: "set null",
    }),
    ...workflow,
    ...seo,
    ...aiMetadata,
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_slug_idx").on(table.slug),
    index("projects_status_idx").on(table.status),
    index("projects_position_idx").on(table.position),
    index("projects_experience_idx").on(table.experienceId),
    index("projects_date_idx").on(table.startDate, table.endDate),
    check(
      "projects_repository_url_source_availability_chk",
      sql`${table.sourceAvailability} = 'open-source' OR ${table.repositoryUrl} IS NULL OR btrim(${table.repositoryUrl}) = ''`,
    ),
    check(
      "projects_demo_url_release_status_chk",
      sql`${table.releaseStatus} = 'released' OR ${table.demoUrl} IS NULL OR btrim(${table.demoUrl}) = ''`,
    ),
    check(
      "projects_url_release_status_chk",
      sql`${table.releaseStatus} = 'released' OR ${table.url} IS NULL OR btrim(${table.url}) = ''`,
    ),
  ],
);

export const projectLinks = pgTable(
  "project_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("project_links_project_idx").on(table.projectId),
  ],
);

export const projectEvidenceAssets = pgTable(
  "project_evidence_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    data: bytea("data").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("project_evidence_assets_project_idx").on(table.projectId),
    index("project_evidence_assets_uploaded_at_idx").on(table.uploadedAt),
  ],
);

export const caseStudies = pgTable(
  "case_studies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    title: varchar("title", { length: 220 }).notNull(),
    excerpt: text("excerpt").notNull().default(""),
    context: text("context").notNull().default(""),
    problem: text("problem").notNull().default(""),
    constraints: text("constraints").notNull().default(""),
    action: text("action").notNull().default(""),
    tradeoffs: text("tradeoffs").notNull().default(""),
    outcome: text("outcome").notNull().default(""),
    learning: text("learning").notNull().default(""),
    ...workflow,
    ...seo,
    ...aiMetadata,
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("case_studies_slug_idx").on(table.slug),
    index("case_studies_status_idx").on(table.status),
    index("case_studies_position_idx").on(table.position),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 140 }).notNull(),
    category: varchar("category", { length: 120 }),
    summary: text("summary").notNull().default(""),
    ...workflow,
    ...aiMetadata,
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("skills_slug_idx").on(table.slug),
    index("skills_status_idx").on(table.status),
    index("skills_category_idx").on(table.category),
    index("skills_position_idx").on(table.position),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 140 }).notNull(),
    category: varchar("category", { length: 120 }),
    ...workflow,
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tags_slug_idx").on(table.slug),
    index("tags_status_idx").on(table.status),
    index("tags_category_idx").on(table.category),
  ],
);

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mode: varchar("mode", { length: 40 }).notNull().default("technical"),
    intent: varchar("intent", { length: 80 }).notNull().default("collaboration"),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }),
    wantsResponse: boolean("wants_response").notNull().default(false),
    company: varchar("company", { length: 180 }),
    roleTitle: varchar("role_title", { length: 180 }),
    techStack: text("tech_stack"),
    problem: text("problem").notNull().default(""),
    desiredOutcome: text("desired_outcome"),
    timeline: varchar("timeline", { length: 180 }),
    message: text("message").notNull(),
    ...timestamps,
  },
  (table) => [
    index("contact_submissions_created_at_idx").on(table.createdAt),
    index("contact_submissions_wants_response_idx").on(table.wantsResponse),
  ],
);

export const contactProfiles = pgTable(
  "contact_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationLabel: varchar("location_label", { length: 180 }),
    availabilityLabel: text("availability_label"),
    timezoneLabel: varchar("timezone_label", { length: 120 }),
    responseTimeLabel: varchar("response_time_label", { length: 180 }),
    linkedinUrl: text("linkedin_url"),
    githubUrl: text("github_url"),
    emailAddress: varchar("email_address", { length: 320 }),
    resumeUrl: text("resume_url"),
    shortContactIntro: text("short_contact_intro"),
    openToItems: jsonb("open_to_items")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    ...timestamps,
  },
  (table) => [
    index("contact_profiles_updated_at_idx").on(table.updatedAt),
  ],
);

/**
 * The uploaded resume file (at most one row — uploads replace the previous
 * file). Stored in its own table, not on contact_profiles, so profile reads
 * never drag the binary payload along; routes stream it on demand.
 */
export const contactResume = pgTable("contact_resume", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 120 }).notNull(),
  fileSize: integer("file_size").notNull(),
  data: bytea("data").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const homepageSettings = pgTable(
  "homepage_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleLabel: varchar("role_label", { length: 180 }),
    headline: text("headline"),
    headlineHighlight: varchar("headline_highlight", { length: 180 }),
    summary: text("summary"),
    primaryCtaLabel: varchar("primary_cta_label", { length: 120 }),
    primaryCtaHref: varchar("primary_cta_href", { length: 240 }),
    secondaryCtaLabel: varchar("secondary_cta_label", { length: 120 }),
    secondaryCtaHref: varchar("secondary_cta_href", { length: 240 }),
    codeRoleLabel: varchar("code_role_label", { length: 180 }),
    codeMindsetLabel: varchar("code_mindset_label", { length: 220 }),
    codeLocationLabel: varchar("code_location_label", { length: 180 }),
    codeExperienceLabel: varchar("code_experience_label", { length: 120 }),
    codeFocusItems: jsonb("code_focus_items")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    metricCards: jsonb("metric_cards")
      .$type<HomepageMetric[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    featuredSkillIds: jsonb("featured_skill_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    featuredPrincipleIds: jsonb("featured_principle_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    featuredCaseStudyIds: jsonb("featured_case_study_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    featuredRecognitionExperienceId: uuid("featured_recognition_experience_id").references(
      () => experiences.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [
    index("homepage_settings_updated_at_idx").on(table.updatedAt),
    index("homepage_settings_recognition_experience_idx").on(
      table.featuredRecognitionExperienceId,
    ),
  ],
);

export const llmTasks = pgTable(
  "llm_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskType: varchar("task_type", { length: 80 }).notNull(),
    targetType: varchar("target_type", { length: 80 }),
    targetId: uuid("target_id"),
    title: varchar("title", { length: 180 }).notNull(),
    status: llmTaskStatusEnum("status").notNull().default("pending"),
    providerName: varchar("provider_name", { length: 180 }),
    providerModel: varchar("provider_model", { length: 220 }),
    promptSystem: text("prompt_system").notNull().default(""),
    promptUser: text("prompt_user").notNull().default(""),
    rawResponse: text("raw_response"),
    parsedResponse: jsonb("parsed_response").$type<unknown>(),
    finishReason: varchar("finish_reason", { length: 120 }),
    errorStage: varchar("error_stage", { length: 80 }),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    /** Incremented each time the task is claimed; surfaced in worker logs. */
    attempts: integer("attempts").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("llm_tasks_created_at_idx").on(table.createdAt),
    index("llm_tasks_status_idx").on(table.status),
    index("llm_tasks_task_type_idx").on(table.taskType),
    index("llm_tasks_target_idx").on(table.targetType, table.targetId),
    uniqueIndex("llm_tasks_active_ai_insights_idx")
      .on(table.taskType)
      .where(
        sql`${table.taskType} = 'ai_insights' and ${table.status} in ('pending', 'running')`,
      ),
    uniqueIndex("llm_tasks_active_experience_ai_review_idx")
      .on(table.targetId)
      .where(
        sql`${table.taskType} = 'experience_ai_review' and ${table.status} in ('pending', 'running')`,
      ),
    uniqueIndex("llm_tasks_active_project_ai_review_idx")
      .on(table.targetId)
      .where(
        sql`${table.taskType} = 'project_ai_review' and ${table.status} in ('pending', 'running')`,
      ),
    uniqueIndex("llm_tasks_active_case_study_ai_review_idx")
      .on(table.targetId)
      .where(
        sql`${table.taskType} = 'case_study_ai_review' and ${table.status} in ('pending', 'running')`,
      ),
  ],
);

export const aiInsightRunStatusEnum = pgEnum("ai_insight_run_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
  "published",
]);

export type AiInsightRunStatusValue = (typeof aiInsightRunStatusEnum.enumValues)[number];

/** One LLM attempt within a run (retries append entries). Stored as jsonb. */
export interface AiInsightRunAttempt {
  attemptNo: number;
  provider: string;
  model: string | null;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  } | null;
}

/**
 * Evidence-driven AI insight generation runs. Every generation is persisted —
 * never overwritten — with its full audit trail: the normalized input snapshot,
 * prompt version, provider metadata, raw + validated output, validation notes,
 * and token usage. Publishing flips status to 'published'; a partial unique
 * index guarantees at most one published run, which is what the public site
 * renders. `outputJson` is typed `unknown` on purpose: readers re-validate with
 * `portfolioInsightOutputSchema` from @portfolio/validators before rendering.
 */
export const aiInsightRuns = pgTable(
  "ai_insight_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: aiInsightRunStatusEnum("status").notNull().default("pending"),
    provider: varchar("provider", { length: 180 }),
    model: varchar("model", { length: 220 }),
    promptVersion: varchar("prompt_version", { length: 40 }).notNull(),
    promptSystem: text("prompt_system").notNull().default(""),
    promptUser: text("prompt_user").notNull().default(""),
    inputSnapshot: jsonb("input_snapshot").$type<unknown>().notNull(),
    rawResponse: text("raw_response"),
    outputJson: jsonb("output_json").$type<unknown>(),
    validationNotes: jsonb("validation_notes").$type<string[]>(),
    tokenUsage: jsonb("token_usage").$type<{
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    }>(),
    attempts: jsonb("attempts").$type<AiInsightRunAttempt[]>(),
    errorStage: varchar("error_stage", { length: 80 }),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("ai_insight_runs_created_at_idx").on(table.createdAt),
    index("ai_insight_runs_status_idx").on(table.status),
    // At most one published run at any time — the public site's source of truth.
    uniqueIndex("ai_insight_runs_single_published_idx")
      .on(table.status)
      .where(sql`${table.status} = 'published'`),
    // At most one run per active status. Runs are created as 'running', so this
    // (plus the app-level getActiveAiInsightRun guard) yields a single active run.
    uniqueIndex("ai_insight_runs_single_active_idx")
      .on(table.status)
      .where(sql`${table.status} in ('pending', 'running')`),
  ]
);

export const aiReviewQualitySnapshots = pgTable(
  "ai_review_quality_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentType: varchar("content_type", { length: 40 }).notNull(),
    contentId: uuid("content_id").notNull(),
    contentTitle: varchar("content_title", { length: 220 }).notNull(),
    qualityScore: integer("quality_score").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    index("ai_review_quality_snapshots_content_idx").on(table.contentType, table.contentId),
    index("ai_review_quality_snapshots_reviewed_at_idx").on(table.reviewedAt),
  ],
);

// Story content types live in @portfolio/validators (shared with the LLM
// package); re-exported here so existing `@portfolio/db/schema` imports keep
// working.
export type {
  AiGeneratedLensRenameSuggestion,
  AiGeneratedStoryPart,
  AiGeneratedStoryPayload,
} from "@portfolio/validators";

export const aiGeneratedStories = pgTable(
  "ai_generated_stories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 220 }).notNull(),
    sourcePrompt: text("source_prompt").notNull(),
    status: aiGeneratedStoryStatusEnum("status").notNull().default("draft"),
    providerName: varchar("provider_name", { length: 180 }),
    providerModel: varchar("provider_model", { length: 220 }),
    // Prompt audit trail (nullable: stories generated before prompt logging).
    promptVersion: varchar("prompt_version", { length: 40 }),
    promptSystem: text("prompt_system"),
    promptUser: text("prompt_user"),
    generatedContent: jsonb("generated_content").$type<AiGeneratedStoryPayload>().notNull(),
    rawResponse: text("raw_response"),
    finishReason: varchar("finish_reason", { length: 120 }),
    errorMessage: text("error_message"),
    targetType: varchar("target_type", { length: 60 }),
    targetId: uuid("target_id"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("ai_generated_stories_created_at_idx").on(table.createdAt),
    index("ai_generated_stories_status_idx").on(table.status),
  ],
);

export const experienceLenses = pgTable(
  "experience_lenses",
  {
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    lensId: uuid("lens_id")
      .notNull()
      .references(() => lenses.id, { onDelete: "cascade" }),
    relevanceScore: integer("relevance_score"),
  },
  (table) => [
    primaryKey({ columns: [table.experienceId, table.lensId] }),
  ],
);

export const experiencePrinciples = pgTable(
  "experience_principles",
  {
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    principleId: uuid("principle_id")
      .notNull()
      .references(() => principles.id, { onDelete: "cascade" }),
    relevanceScore: integer("relevance_score"),
  },
  (table) => [
    primaryKey({ columns: [table.experienceId, table.principleId] }),
  ],
);

export const experienceSkills = pgTable(
  "experience_skills",
  {
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.experienceId, table.skillId] }),
  ],
);

export const experienceTags = pgTable(
  "experience_tags",
  {
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.experienceId, table.tagId] }),
  ],
);

export const projectLenses = pgTable(
  "project_lenses",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    lensId: uuid("lens_id")
      .notNull()
      .references(() => lenses.id, { onDelete: "cascade" }),
    relevanceScore: integer("relevance_score"),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.lensId] }),
  ],
);

export const projectPrinciples = pgTable(
  "project_principles",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    principleId: uuid("principle_id")
      .notNull()
      .references(() => principles.id, { onDelete: "cascade" }),
    relevanceScore: integer("relevance_score"),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.principleId] }),
  ],
);

export const projectSkills = pgTable(
  "project_skills",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.skillId] }),
  ],
);

export const projectTags = pgTable(
  "project_tags",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.tagId] }),
  ],
);

export const caseStudyLenses = pgTable(
  "case_study_lenses",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    lensId: uuid("lens_id")
      .notNull()
      .references(() => lenses.id, { onDelete: "cascade" }),
    relevanceScore: integer("relevance_score"),
  },
  (table) => [
    primaryKey({ columns: [table.caseStudyId, table.lensId] }),
  ],
);

export const caseStudyPrinciples = pgTable(
  "case_study_principles",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    principleId: uuid("principle_id")
      .notNull()
      .references(() => principles.id, { onDelete: "cascade" }),
    relevanceScore: integer("relevance_score"),
  },
  (table) => [
    primaryKey({ columns: [table.caseStudyId, table.principleId] }),
  ],
);

export const caseStudyExperiences = pgTable(
  "case_study_experiences",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    experienceId: uuid("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.caseStudyId, table.experienceId] }),
  ],
);

export const caseStudyProjects = pgTable(
  "case_study_projects",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.caseStudyId, table.projectId] }),
  ],
);

export const caseStudySkills = pgTable(
  "case_study_skills",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.caseStudyId, table.skillId] }),
  ],
);

export const caseStudyTags = pgTable(
  "case_study_tags",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.caseStudyId, table.tagId] }),
  ],
);

export const decisionPatternPrinciples = pgTable(
  "decision_pattern_principles",
  {
    decisionPatternId: uuid("decision_pattern_id")
      .notNull()
      .references(() => decisionPatterns.id, { onDelete: "cascade" }),
    principleId: uuid("principle_id")
      .notNull()
      .references(() => principles.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.decisionPatternId, table.principleId] }),
  ],
);

export const lensRelations = relations(lenses, ({ many }) => ({
  caseStudies: many(caseStudyLenses),
  experiences: many(experienceLenses),
  projects: many(projectLenses),
}));

export const principleRelations = relations(principles, ({ many }) => ({
  caseStudies: many(caseStudyPrinciples),
  decisionPatterns: many(decisionPatternPrinciples),
  experiences: many(experiencePrinciples),
  projects: many(projectPrinciples),
}));

export const decisionPatternRelations = relations(decisionPatterns, ({ many }) => ({
  principles: many(decisionPatternPrinciples),
}));

export const experienceRelations = relations(experiences, ({ many }) => ({
  caseStudies: many(caseStudyExperiences),
  lenses: many(experienceLenses),
  principles: many(experiencePrinciples),
  skills: many(experienceSkills),
  tags: many(experienceTags),
}));

export const projectRelations = relations(projects, ({ many }) => ({
  evidenceAssets: many(projectEvidenceAssets),
  caseStudies: many(caseStudyProjects),
  lenses: many(projectLenses),
  links: many(projectLinks),
  principles: many(projectPrinciples),
  skills: many(projectSkills),
  tags: many(projectTags),
}));

export const projectEvidenceAssetRelations = relations(projectEvidenceAssets, ({ one }) => ({
  project: one(projects, {
    fields: [projectEvidenceAssets.projectId],
    references: [projects.id],
  }),
}));

export const caseStudyRelations = relations(caseStudies, ({ many }) => ({
  experiences: many(caseStudyExperiences),
  lenses: many(caseStudyLenses),
  principles: many(caseStudyPrinciples),
  projects: many(caseStudyProjects),
  skills: many(caseStudySkills),
  tags: many(caseStudyTags),
}));

export const skillRelations = relations(skills, ({ many }) => ({
  caseStudies: many(caseStudySkills),
  experiences: many(experienceSkills),
  projects: many(projectSkills),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  caseStudies: many(caseStudyTags),
  experiences: many(experienceTags),
  projects: many(projectTags),
}));
