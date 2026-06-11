ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "start_date" date;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "end_date" date;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_date_idx" ON "projects" USING btree ("start_date","end_date");
