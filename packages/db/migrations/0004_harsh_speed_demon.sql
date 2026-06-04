CREATE TYPE "public"."llm_task_status" AS ENUM('pending', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TABLE "llm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_type" varchar(80) NOT NULL,
	"title" varchar(180) NOT NULL,
	"status" "llm_task_status" DEFAULT 'pending' NOT NULL,
	"provider_name" varchar(180),
	"provider_model" varchar(220),
	"prompt_system" text DEFAULT '' NOT NULL,
	"prompt_user" text DEFAULT '' NOT NULL,
	"raw_response" text,
	"parsed_response" jsonb,
	"error_stage" varchar(80),
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "llm_tasks_created_at_idx" ON "llm_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_tasks_status_idx" ON "llm_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "llm_tasks_task_type_idx" ON "llm_tasks" USING btree ("task_type");