ALTER TABLE "ai_generated_stories" ADD COLUMN IF NOT EXISTS "target_type" varchar(60);--> statement-breakpoint
ALTER TABLE "ai_generated_stories" ADD COLUMN IF NOT EXISTS "target_id" uuid;--> statement-breakpoint
