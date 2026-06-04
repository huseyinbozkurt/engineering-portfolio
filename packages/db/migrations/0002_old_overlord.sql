ALTER TABLE "tags" ADD COLUMN "category" varchar(120);--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category");--> statement-breakpoint
CREATE INDEX "tags_category_idx" ON "tags" USING btree ("category");