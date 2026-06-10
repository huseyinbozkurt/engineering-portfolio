CREATE TYPE "public"."ai_insight_run_status" AS ENUM('pending', 'running', 'succeeded', 'failed', 'published');--> statement-breakpoint
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
CREATE INDEX "ai_insight_runs_created_at_idx" ON "ai_insight_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_insight_runs_status_idx" ON "ai_insight_runs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_insight_runs_single_published_idx" ON "ai_insight_runs" USING btree ("status") WHERE "ai_insight_runs"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "ai_insight_runs_single_active_idx" ON "ai_insight_runs" USING btree ("status") WHERE "ai_insight_runs"."status" in ('pending', 'running');