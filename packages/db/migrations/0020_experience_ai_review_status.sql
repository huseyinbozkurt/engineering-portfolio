CREATE TYPE "public"."ai_review_status" AS ENUM('idle', 'queued', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "ai_review_error" text;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN "ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN "ai_review_error" text;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN "ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN "ai_review_error" text;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN "ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN "ai_review_error" text;--> statement-breakpoint
ALTER TABLE "llm_tasks" ADD COLUMN "target_type" varchar(80);--> statement-breakpoint
ALTER TABLE "llm_tasks" ADD COLUMN "target_id" uuid;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN "ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN "ai_review_error" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ai_review_error" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "ai_review_status" "ai_review_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "ai_review_error" text;--> statement-breakpoint
CREATE INDEX "llm_tasks_target_idx" ON "llm_tasks" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "llm_tasks_active_experience_ai_review_idx" ON "llm_tasks" USING btree ("target_id") WHERE "llm_tasks"."task_type" = 'experience_ai_review' and "llm_tasks"."status" in ('pending', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "llm_tasks_active_project_ai_review_idx" ON "llm_tasks" USING btree ("target_id") WHERE "llm_tasks"."task_type" = 'project_ai_review' and "llm_tasks"."status" in ('pending', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "llm_tasks_active_case_study_ai_review_idx" ON "llm_tasks" USING btree ("target_id") WHERE "llm_tasks"."task_type" = 'case_study_ai_review' and "llm_tasks"."status" in ('pending', 'running');
