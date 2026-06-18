DROP INDEX "llm_prompt_versions_single_active_idx";--> statement-breakpoint
ALTER TABLE "llm_prompt_versions" ADD COLUMN "target_type" varchar(40) DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "llm_prompt_versions_single_active_idx" ON "llm_prompt_versions" USING btree ("workflow","target_type") WHERE "llm_prompt_versions"."is_active" = true;