ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_title" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "seo_description" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "og_image" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "content_quality_score" integer;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "last_ai_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "ai_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "case_study_lenses" ADD COLUMN IF NOT EXISTS "relevance_score" integer;--> statement-breakpoint
ALTER TABLE "case_study_principles" ADD COLUMN IF NOT EXISTS "relevance_score" integer;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "status" "content_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "seo_title" text;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "seo_description" text;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "og_image" text;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "content_quality_score" integer;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "last_ai_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "decision_patterns" ADD COLUMN IF NOT EXISTS "ai_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "experience_lenses" ADD COLUMN IF NOT EXISTS "relevance_score" integer;--> statement-breakpoint
ALTER TABLE "experience_principles" ADD COLUMN IF NOT EXISTS "relevance_score" integer;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "slug" varchar(120);--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "status" "content_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "seo_title" text;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "seo_description" text;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "og_image" text;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "content_quality_score" integer;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "last_ai_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "ai_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "status" "content_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "seo_title" text;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "seo_description" text;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "og_image" text;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "content_quality_score" integer;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "last_ai_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "lenses" ADD COLUMN IF NOT EXISTS "ai_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "status" "content_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "seo_title" text;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "seo_description" text;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "og_image" text;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "content_quality_score" integer;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "last_ai_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "principles" ADD COLUMN IF NOT EXISTS "ai_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "project_lenses" ADD COLUMN IF NOT EXISTS "relevance_score" integer;--> statement-breakpoint
ALTER TABLE "project_principles" ADD COLUMN IF NOT EXISTS "relevance_score" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "seo_title" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "seo_description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "og_image" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "content_quality_score" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "last_ai_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "ai_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "status" "content_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "content_quality_score" integer;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "last_ai_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "ai_summary" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN IF NOT EXISTS "ai_suggestions" jsonb;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "status" "content_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decision_patterns_status_idx" ON "decision_patterns" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "experiences_slug_idx" ON "experiences" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "experiences_status_idx" ON "experiences" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lenses_status_idx" ON "lenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "principles_status_idx" ON "principles" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_status_idx" ON "tags" USING btree ("status");