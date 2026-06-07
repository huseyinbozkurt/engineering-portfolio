CREATE TYPE "public"."ai_generated_story_status" AS ENUM('draft', 'applied', 'failed');--> statement-breakpoint
CREATE TABLE "ai_generated_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(220) NOT NULL,
	"source_prompt" text NOT NULL,
	"status" "ai_generated_story_status" DEFAULT 'draft' NOT NULL,
	"provider_name" varchar(180),
	"provider_model" varchar(220),
	"generated_content" jsonb NOT NULL,
	"raw_response" text,
	"finish_reason" varchar(120),
	"error_message" text,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_generated_stories_created_at_idx" ON "ai_generated_stories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_generated_stories_status_idx" ON "ai_generated_stories" USING btree ("status");