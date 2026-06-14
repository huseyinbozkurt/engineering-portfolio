CREATE TYPE "public"."ai_generated_story_status" AS ENUM('draft', 'applied', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ai_insight_run_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'published');--> statement-breakpoint
CREATE TYPE "public"."ai_review_status" AS ENUM('idle', 'queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."llm_task_status" AS ENUM('pending', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_review_action" AS ENUM('add', 'remove', 'rename', 'merge');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_review_confidence" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_review_run_status" AS ENUM('pending', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_review_suggestion_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_review_target_group" AS ENUM('skills', 'tags', 'lenses', 'principles', 'decisionPatterns');--> statement-breakpoint
CREATE TABLE "ai_generated_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(220) NOT NULL,
	"source_prompt" text NOT NULL,
	"status" "ai_generated_story_status" DEFAULT 'draft' NOT NULL,
	"provider_name" varchar(180),
	"provider_model" varchar(220),
	"prompt_version" varchar(40),
	"prompt_system" text,
	"prompt_user" text,
	"generated_content" jsonb NOT NULL,
	"raw_response" text,
	"finish_reason" varchar(120),
	"error_message" text,
	"target_type" varchar(60),
	"target_id" uuid,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_insight_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "ai_insight_run_status" DEFAULT 'pending' NOT NULL,
	"provider" varchar(180),
	"model" varchar(220),
	"prompt_version" varchar(40) NOT NULL,
	"prompt_system" text DEFAULT '' NOT NULL,
	"prompt_user" text DEFAULT '' NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"raw_response" text,
	"output_json" jsonb,
	"validation_notes" jsonb,
	"token_usage" jsonb,
	"attempts" jsonb,
	"error_stage" varchar(80),
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_review_quality_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" varchar(40) NOT NULL,
	"content_id" uuid NOT NULL,
	"content_title" varchar(220) NOT NULL,
	"quality_score" integer NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(220) NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"context" text DEFAULT '' NOT NULL,
	"problem" text DEFAULT '' NOT NULL,
	"constraints" text DEFAULT '' NOT NULL,
	"action" text DEFAULT '' NOT NULL,
	"tradeoffs" text DEFAULT '' NOT NULL,
	"outcome" text DEFAULT '' NOT NULL,
	"learning" text DEFAULT '' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"content_quality_score" integer,
	"last_ai_review_at" timestamp with time zone,
	"ai_summary" text,
	"ai_suggestions" jsonb,
	"ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL,
	"ai_review_error" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_study_experiences" (
	"case_study_id" uuid NOT NULL,
	"experience_id" uuid NOT NULL,
	CONSTRAINT "case_study_experiences_case_study_id_experience_id_pk" PRIMARY KEY("case_study_id","experience_id")
);
--> statement-breakpoint
CREATE TABLE "case_study_lenses" (
	"case_study_id" uuid NOT NULL,
	"lens_id" uuid NOT NULL,
	"relevance_score" integer,
	CONSTRAINT "case_study_lenses_case_study_id_lens_id_pk" PRIMARY KEY("case_study_id","lens_id")
);
--> statement-breakpoint
CREATE TABLE "case_study_principles" (
	"case_study_id" uuid NOT NULL,
	"principle_id" uuid NOT NULL,
	"relevance_score" integer,
	CONSTRAINT "case_study_principles_case_study_id_principle_id_pk" PRIMARY KEY("case_study_id","principle_id")
);
--> statement-breakpoint
CREATE TABLE "case_study_projects" (
	"case_study_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	CONSTRAINT "case_study_projects_case_study_id_project_id_pk" PRIMARY KEY("case_study_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "case_study_skills" (
	"case_study_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "case_study_skills_case_study_id_skill_id_pk" PRIMARY KEY("case_study_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "case_study_tags" (
	"case_study_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "case_study_tags_case_study_id_tag_id_pk" PRIMARY KEY("case_study_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "contact_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_label" varchar(180),
	"availability_label" text,
	"timezone_label" varchar(120),
	"response_time_label" varchar(180),
	"linkedin_url" text,
	"github_url" text,
	"email_address" varchar(320),
	"resume_url" text,
	"short_contact_intro" text,
	"open_to_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_resume" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(120) NOT NULL,
	"file_size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" varchar(40) DEFAULT 'technical' NOT NULL,
	"intent" varchar(80) DEFAULT 'collaboration' NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(320),
	"wants_response" boolean DEFAULT false NOT NULL,
	"company" varchar(180),
	"role_title" varchar(180),
	"tech_stack" text,
	"problem" text DEFAULT '' NOT NULL,
	"desired_outcome" text,
	"timeline" varchar(180),
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decision_pattern_principles" (
	"decision_pattern_id" uuid NOT NULL,
	"principle_id" uuid NOT NULL,
	CONSTRAINT "decision_pattern_principles_decision_pattern_id_principle_id_pk" PRIMARY KEY("decision_pattern_id","principle_id")
);
--> statement-breakpoint
CREATE TABLE "decision_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"content_quality_score" integer,
	"last_ai_review_at" timestamp with time zone,
	"ai_summary" text,
	"ai_suggestions" jsonb,
	"ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL,
	"ai_review_error" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_lenses" (
	"experience_id" uuid NOT NULL,
	"lens_id" uuid NOT NULL,
	"relevance_score" integer,
	CONSTRAINT "experience_lenses_experience_id_lens_id_pk" PRIMARY KEY("experience_id","lens_id")
);
--> statement-breakpoint
CREATE TABLE "experience_principles" (
	"experience_id" uuid NOT NULL,
	"principle_id" uuid NOT NULL,
	"relevance_score" integer,
	CONSTRAINT "experience_principles_experience_id_principle_id_pk" PRIMARY KEY("experience_id","principle_id")
);
--> statement-breakpoint
CREATE TABLE "experience_skills" (
	"experience_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "experience_skills_experience_id_skill_id_pk" PRIMARY KEY("experience_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "experience_tags" (
	"experience_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "experience_tags_experience_id_tag_id_pk" PRIMARY KEY("experience_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120),
	"company" varchar(180) NOT NULL,
	"role" varchar(180) NOT NULL,
	"location" varchar(160),
	"start_date" date,
	"end_date" date,
	"is_current" boolean DEFAULT false NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"awards" text DEFAULT '' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"content_quality_score" integer,
	"last_ai_review_at" timestamp with time zone,
	"ai_summary" text,
	"ai_suggestions" jsonb,
	"ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL,
	"ai_review_error" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homepage_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_label" varchar(180),
	"headline" text,
	"headline_highlight" varchar(180),
	"summary" text,
	"primary_cta_label" varchar(120),
	"primary_cta_href" varchar(240),
	"secondary_cta_label" varchar(120),
	"secondary_cta_href" varchar(240),
	"code_role_label" varchar(180),
	"code_mindset_label" varchar(220),
	"code_location_label" varchar(180),
	"code_experience_label" varchar(120),
	"code_focus_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metric_cards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_skill_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_principle_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_case_study_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_recognition_experience_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"accent_color" varchar(32) DEFAULT '#7dd3fc' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"content_quality_score" integer,
	"last_ai_review_at" timestamp with time zone,
	"ai_summary" text,
	"ai_suggestions" jsonb,
	"ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL,
	"ai_review_error" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_type" varchar(80) NOT NULL,
	"target_type" varchar(80),
	"target_id" uuid,
	"title" varchar(180) NOT NULL,
	"status" "llm_task_status" DEFAULT 'pending' NOT NULL,
	"provider_name" varchar(180),
	"provider_model" varchar(220),
	"prompt_system" text DEFAULT '' NOT NULL,
	"prompt_user" text DEFAULT '' NOT NULL,
	"raw_response" text,
	"parsed_response" jsonb,
	"finish_reason" varchar(120),
	"error_stage" varchar(80),
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "principles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"content_quality_score" integer,
	"last_ai_review_at" timestamp with time zone,
	"ai_summary" text,
	"ai_suggestions" jsonb,
	"ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL,
	"ai_review_error" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_evidence_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_lenses" (
	"project_id" uuid NOT NULL,
	"lens_id" uuid NOT NULL,
	"relevance_score" integer,
	CONSTRAINT "project_lenses_project_id_lens_id_pk" PRIMARY KEY("project_id","lens_id")
);
--> statement-breakpoint
CREATE TABLE "project_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"label" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_principles" (
	"project_id" uuid NOT NULL,
	"principle_id" uuid NOT NULL,
	"relevance_score" integer,
	CONSTRAINT "project_principles_project_id_principle_id_pk" PRIMARY KEY("project_id","principle_id")
);
--> statement-breakpoint
CREATE TABLE "project_skills" (
	"project_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "project_skills_project_id_skill_id_pk" PRIMARY KEY("project_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "project_tags" (
	"project_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "project_tags_project_id_tag_id_pk" PRIMARY KEY("project_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"details" text DEFAULT '' NOT NULL,
	"architecture" text DEFAULT '' NOT NULL,
	"development_tech_stack" text DEFAULT '' NOT NULL,
	"qa_tech_stack" text DEFAULT '' NOT NULL,
	"ai_integration_tech_stack" text DEFAULT '' NOT NULL,
	"deployment_tech_stack" text DEFAULT '' NOT NULL,
	"url" text,
	"github_url" text,
	"portfolio_visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"project_type" varchar(40) DEFAULT 'product' NOT NULL,
	"project_status" varchar(40) DEFAULT 'completed' NOT NULL,
	"project_role" varchar(40) DEFAULT 'solo-builder' NOT NULL,
	"confidentiality" varchar(40) DEFAULT 'none' NOT NULL,
	"ownership" varchar(40) DEFAULT 'end-to-end-owner' NOT NULL,
	"team_size" integer,
	"duration_months" integer,
	"motivation" text DEFAULT '' NOT NULL,
	"problem" text DEFAULT '' NOT NULL,
	"constraints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"trade_offs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"what_i_learned" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contributions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"decisions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"engineering_signals" jsonb DEFAULT '{"testing":"none","ciCd":"none","observability":"none","documentation":"none","security":"none","infrastructure":"none","aiIntegration":"none"}'::jsonb NOT NULL,
	"project_signals" jsonb DEFAULT '{"complexity":3,"ambiguity":3,"ownership":3,"crossFunctionality":3,"operationalResponsibility":3,"innovation":3}'::jsonb NOT NULL,
	"source_availability" varchar(30) DEFAULT 'closed-source' NOT NULL,
	"repository_url" text,
	"release_status" varchar(30) DEFAULT 'in-development' NOT NULL,
	"demo_url" text,
	"start_date" date,
	"end_date" date,
	"experience_id" uuid,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"content_quality_score" integer,
	"last_ai_review_at" timestamp with time zone,
	"ai_summary" text,
	"ai_suggestions" jsonb,
	"ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL,
	"ai_review_error" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_repository_url_source_availability_chk" CHECK ("projects"."source_availability" = 'open-source' OR "projects"."repository_url" IS NULL OR btrim("projects"."repository_url") = ''),
	CONSTRAINT "projects_demo_url_release_status_chk" CHECK ("projects"."release_status" = 'released' OR "projects"."demo_url" IS NULL OR btrim("projects"."demo_url") = ''),
	CONSTRAINT "projects_url_release_status_chk" CHECK ("projects"."release_status" = 'released' OR "projects"."url" IS NULL OR btrim("projects"."url") = '')
);
--> statement-breakpoint
CREATE TABLE "site_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_name" text DEFAULT 'Huseyin Bozkurt' NOT NULL,
	"brand_logo_image_id" uuid,
	"show_brand_name" boolean DEFAULT true NOT NULL,
	"brand_logo_size" integer DEFAULT 28 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_brand_logo_size_chk" CHECK ("site_settings"."brand_logo_size" between 16 and 96)
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(140) NOT NULL,
	"category" varchar(120),
	"summary" text DEFAULT '' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"content_quality_score" integer,
	"last_ai_review_at" timestamp with time zone,
	"ai_summary" text,
	"ai_suggestions" jsonb,
	"ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL,
	"ai_review_error" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(140) NOT NULL,
	"category" varchar(120),
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_review_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "taxonomy_review_run_status" DEFAULT 'pending' NOT NULL,
	"provider" varchar(180),
	"model" varchar(220),
	"prompt_version" varchar(60) NOT NULL,
	"prompt_system" text DEFAULT '' NOT NULL,
	"prompt_user" text DEFAULT '' NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"raw_response" text,
	"output_json" jsonb,
	"validation_notes" jsonb,
	"token_usage" jsonb,
	"attempts" jsonb,
	"error_stage" varchar(80),
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"generated_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_review_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"target_group" "taxonomy_review_target_group" NOT NULL,
	"action" "taxonomy_review_action" NOT NULL,
	"status" "taxonomy_review_suggestion_status" DEFAULT 'pending' NOT NULL,
	"current_value" text,
	"proposed_value" text,
	"original_value" text,
	"reason" text NOT NULL,
	"confidence" "taxonomy_review_confidence" NOT NULL,
	"evidence_refs" jsonb NOT NULL,
	"affected_records" jsonb NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_study_experiences" ADD CONSTRAINT "case_study_experiences_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_experiences" ADD CONSTRAINT "case_study_experiences_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_lenses" ADD CONSTRAINT "case_study_lenses_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_lenses" ADD CONSTRAINT "case_study_lenses_lens_id_lenses_id_fk" FOREIGN KEY ("lens_id") REFERENCES "public"."lenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_principles" ADD CONSTRAINT "case_study_principles_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_principles" ADD CONSTRAINT "case_study_principles_principle_id_principles_id_fk" FOREIGN KEY ("principle_id") REFERENCES "public"."principles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_projects" ADD CONSTRAINT "case_study_projects_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_projects" ADD CONSTRAINT "case_study_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_skills" ADD CONSTRAINT "case_study_skills_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_skills" ADD CONSTRAINT "case_study_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_tags" ADD CONSTRAINT "case_study_tags_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_tags" ADD CONSTRAINT "case_study_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_pattern_principles" ADD CONSTRAINT "decision_pattern_principles_decision_pattern_id_decision_patterns_id_fk" FOREIGN KEY ("decision_pattern_id") REFERENCES "public"."decision_patterns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_pattern_principles" ADD CONSTRAINT "decision_pattern_principles_principle_id_principles_id_fk" FOREIGN KEY ("principle_id") REFERENCES "public"."principles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_lenses" ADD CONSTRAINT "experience_lenses_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_lenses" ADD CONSTRAINT "experience_lenses_lens_id_lenses_id_fk" FOREIGN KEY ("lens_id") REFERENCES "public"."lenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_principles" ADD CONSTRAINT "experience_principles_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_principles" ADD CONSTRAINT "experience_principles_principle_id_principles_id_fk" FOREIGN KEY ("principle_id") REFERENCES "public"."principles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_tags" ADD CONSTRAINT "experience_tags_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_tags" ADD CONSTRAINT "experience_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_settings" ADD CONSTRAINT "homepage_settings_featured_recognition_experience_id_experiences_id_fk" FOREIGN KEY ("featured_recognition_experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_evidence_assets" ADD CONSTRAINT "project_evidence_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_lenses" ADD CONSTRAINT "project_lenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_lenses" ADD CONSTRAINT "project_lenses_lens_id_lenses_id_fk" FOREIGN KEY ("lens_id") REFERENCES "public"."lenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_links" ADD CONSTRAINT "project_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_principles" ADD CONSTRAINT "project_principles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_principles" ADD CONSTRAINT "project_principles_principle_id_principles_id_fk" FOREIGN KEY ("principle_id") REFERENCES "public"."principles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_logo_image_id_site_images_id_fk" FOREIGN KEY ("brand_logo_image_id") REFERENCES "public"."site_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taxonomy_review_suggestions" ADD CONSTRAINT "taxonomy_review_suggestions_run_id_taxonomy_review_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."taxonomy_review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_generated_stories_created_at_idx" ON "ai_generated_stories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_generated_stories_status_idx" ON "ai_generated_stories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_insight_runs_created_at_idx" ON "ai_insight_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_insight_runs_status_idx" ON "ai_insight_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_insight_runs_single_published_idx" ON "ai_insight_runs" USING btree ("status") WHERE "ai_insight_runs"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "ai_insight_runs_single_active_idx" ON "ai_insight_runs" USING btree ("status") WHERE "ai_insight_runs"."status" in ('pending', 'running');--> statement-breakpoint
CREATE INDEX "ai_review_quality_snapshots_content_idx" ON "ai_review_quality_snapshots" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "ai_review_quality_snapshots_reviewed_at_idx" ON "ai_review_quality_snapshots" USING btree ("reviewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "case_studies_slug_idx" ON "case_studies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "case_studies_status_idx" ON "case_studies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "case_studies_position_idx" ON "case_studies" USING btree ("position");--> statement-breakpoint
CREATE INDEX "contact_profiles_updated_at_idx" ON "contact_profiles" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "contact_submissions_created_at_idx" ON "contact_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "contact_submissions_wants_response_idx" ON "contact_submissions" USING btree ("wants_response");--> statement-breakpoint
CREATE UNIQUE INDEX "decision_patterns_slug_idx" ON "decision_patterns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "decision_patterns_status_idx" ON "decision_patterns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "decision_patterns_position_idx" ON "decision_patterns" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "experiences_slug_idx" ON "experiences" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "experiences_status_idx" ON "experiences" USING btree ("status");--> statement-breakpoint
CREATE INDEX "experiences_date_idx" ON "experiences" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "experiences_position_idx" ON "experiences" USING btree ("position");--> statement-breakpoint
CREATE INDEX "homepage_settings_updated_at_idx" ON "homepage_settings" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "homepage_settings_recognition_experience_idx" ON "homepage_settings" USING btree ("featured_recognition_experience_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lenses_slug_idx" ON "lenses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "lenses_status_idx" ON "lenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lenses_position_idx" ON "lenses" USING btree ("position");--> statement-breakpoint
CREATE INDEX "llm_tasks_created_at_idx" ON "llm_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_tasks_status_idx" ON "llm_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "llm_tasks_task_type_idx" ON "llm_tasks" USING btree ("task_type");--> statement-breakpoint
CREATE INDEX "llm_tasks_target_idx" ON "llm_tasks" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "llm_tasks_active_ai_insights_idx" ON "llm_tasks" USING btree ("task_type") WHERE "llm_tasks"."task_type" = 'ai_insights' and "llm_tasks"."status" in ('pending', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "llm_tasks_active_experience_ai_review_idx" ON "llm_tasks" USING btree ("target_id") WHERE "llm_tasks"."task_type" = 'experience_ai_review' and "llm_tasks"."status" in ('pending', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "llm_tasks_active_project_ai_review_idx" ON "llm_tasks" USING btree ("target_id") WHERE "llm_tasks"."task_type" = 'project_ai_review' and "llm_tasks"."status" in ('pending', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "llm_tasks_active_case_study_ai_review_idx" ON "llm_tasks" USING btree ("target_id") WHERE "llm_tasks"."task_type" = 'case_study_ai_review' and "llm_tasks"."status" in ('pending', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "principles_slug_idx" ON "principles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "principles_status_idx" ON "principles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "principles_position_idx" ON "principles" USING btree ("position");--> statement-breakpoint
CREATE INDEX "project_evidence_assets_project_idx" ON "project_evidence_assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_evidence_assets_uploaded_at_idx" ON "project_evidence_assets" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "project_links_project_idx" ON "project_links" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_position_idx" ON "projects" USING btree ("position");--> statement-breakpoint
CREATE INDEX "projects_experience_idx" ON "projects" USING btree ("experience_id");--> statement-breakpoint
CREATE INDEX "projects_date_idx" ON "projects" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "site_images_created_at_idx" ON "site_images" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_images_updated_at_idx" ON "site_images" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "site_settings_updated_at_idx" ON "site_settings" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "site_settings_brand_logo_image_idx" ON "site_settings" USING btree ("brand_logo_image_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_slug_idx" ON "skills" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category");--> statement-breakpoint
CREATE INDEX "skills_position_idx" ON "skills" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tags_status_idx" ON "tags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tags_category_idx" ON "tags" USING btree ("category");--> statement-breakpoint
CREATE INDEX "taxonomy_review_runs_created_at_idx" ON "taxonomy_review_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "taxonomy_review_runs_status_idx" ON "taxonomy_review_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_review_runs_single_active_idx" ON "taxonomy_review_runs" USING btree ("status") WHERE "taxonomy_review_runs"."status" in ('pending', 'running');--> statement-breakpoint
CREATE INDEX "taxonomy_review_suggestions_run_idx" ON "taxonomy_review_suggestions" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "taxonomy_review_suggestions_status_idx" ON "taxonomy_review_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "taxonomy_review_suggestions_group_idx" ON "taxonomy_review_suggestions" USING btree ("target_group");