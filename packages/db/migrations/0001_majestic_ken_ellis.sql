CREATE TYPE "public"."llm_run_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'published', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."llm_run_suggestion_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "llm_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" varchar(60) NOT NULL,
	"provider" varchar(120) NOT NULL,
	"model" varchar(220) NOT NULL,
	"visible_model_name" varchar(200),
	"base_url" text,
	"temperature" numeric(4, 3) DEFAULT 0.2 NOT NULL,
	"top_p" numeric(4, 3) DEFAULT 0.9 NOT NULL,
	"max_tokens" integer DEFAULT 12000 NOT NULL,
	"max_retries" integer DEFAULT 2 NOT NULL,
	"timeout_ms" integer,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_prompt_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" varchar(60) NOT NULL,
	"version" varchar(60) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_run_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"suggestion_type" varchar(60) NOT NULL,
	"target_group" varchar(60),
	"target_record_type" varchar(60),
	"target_record_id" uuid,
	"relation_type" varchar(60),
	"action" varchar(40) NOT NULL,
	"status" "llm_run_suggestion_status" DEFAULT 'pending' NOT NULL,
	"current_value" text,
	"proposed_value" text,
	"original_value" text,
	"reason" text NOT NULL,
	"confidence" varchar(20),
	"evidence_refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"affected_records" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow" varchar(60) NOT NULL,
	"target_type" varchar(80),
	"target_id" uuid,
	"status" "llm_run_status" DEFAULT 'pending' NOT NULL,
	"provider" varchar(180),
	"model" varchar(220),
	"visible_model_name" varchar(200),
	"prompt_source" varchar(20) NOT NULL,
	"prompt_version_id" uuid,
	"prompt_version" varchar(60),
	"prompt_name" varchar(200),
	"config_source" varchar(20) NOT NULL,
	"llm_configuration_id" uuid,
	"temperature" numeric(4, 3),
	"top_p" numeric(4, 3),
	"max_tokens" integer,
	"max_retries" integer,
	"timeout_ms" integer,
	"prompt_system" text DEFAULT '' NOT NULL,
	"prompt_user" text DEFAULT '' NOT NULL,
	"input_snapshot" jsonb,
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
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generated_stories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "ai_generated_stories" CASCADE;--> statement-breakpoint
DROP INDEX "taxonomy_review_runs_single_active_idx";--> statement-breakpoint
ALTER TABLE "llm_run_suggestions" ADD CONSTRAINT "llm_run_suggestions_run_id_llm_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."llm_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "llm_configurations_workflow_idx" ON "llm_configurations" USING btree ("workflow");--> statement-breakpoint
CREATE UNIQUE INDEX "llm_configurations_single_active_idx" ON "llm_configurations" USING btree ("workflow") WHERE "llm_configurations"."is_active" = true;--> statement-breakpoint
CREATE INDEX "llm_prompt_versions_workflow_idx" ON "llm_prompt_versions" USING btree ("workflow");--> statement-breakpoint
CREATE UNIQUE INDEX "llm_prompt_versions_single_active_idx" ON "llm_prompt_versions" USING btree ("workflow") WHERE "llm_prompt_versions"."is_active" = true;--> statement-breakpoint
CREATE INDEX "llm_run_suggestions_run_idx" ON "llm_run_suggestions" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "llm_run_suggestions_status_idx" ON "llm_run_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "llm_runs_workflow_idx" ON "llm_runs" USING btree ("workflow");--> statement-breakpoint
CREATE INDEX "llm_runs_status_idx" ON "llm_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "llm_runs_created_at_idx" ON "llm_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_runs_target_idx" ON "llm_runs" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "llm_runs_single_published_idx" ON "llm_runs" USING btree ("workflow") WHERE "llm_runs"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_review_runs_single_active_idx" ON "taxonomy_review_runs" USING btree ("status") WHERE "taxonomy_review_runs"."status" in ('running');--> statement-breakpoint
DROP TYPE "public"."ai_generated_story_status";