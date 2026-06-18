ALTER TABLE "llm_runs" ADD COLUMN "dataset_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "llm_runs" ADD COLUMN "config_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "llm_runs" ADD COLUMN "cache_hit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "llm_runs_cache_identity_idx" ON "llm_runs" USING btree ("workflow","dataset_hash","config_hash");