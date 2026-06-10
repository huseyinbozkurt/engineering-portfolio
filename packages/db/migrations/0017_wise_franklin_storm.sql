ALTER TABLE "ai_generated_stories" ADD COLUMN "prompt_version" varchar(40);--> statement-breakpoint
ALTER TABLE "ai_generated_stories" ADD COLUMN "prompt_system" text;--> statement-breakpoint
ALTER TABLE "ai_generated_stories" ADD COLUMN "prompt_user" text;