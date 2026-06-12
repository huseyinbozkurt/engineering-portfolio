ALTER TABLE "projects" ADD COLUMN "visibility" varchar(20) DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_type" varchar(40) DEFAULT 'product' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_status" varchar(40) DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_role" varchar(40) DEFAULT 'solo-builder' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "confidentiality" varchar(40) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ownership" varchar(40) DEFAULT 'end-to-end-owner' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "team_size" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "duration_months" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "motivation" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "problem" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "constraints" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "trade_offs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "what_i_learned" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "contributions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "decisions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "metrics" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "evidence" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "engineering_signals" jsonb DEFAULT '{"testing":"none","ciCd":"none","observability":"none","documentation":"none","security":"none","infrastructure":"none","aiIntegration":"none"}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "project_signals" jsonb DEFAULT '{"complexity":3,"ambiguity":3,"ownership":3,"crossFunctionality":3,"operationalResponsibility":3,"innovation":3}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repository_visibility" varchar(20) DEFAULT 'unavailable' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "repository_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "demo_available" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "demo_url" text;--> statement-breakpoint
UPDATE "projects"
SET "repository_visibility" = 'public',
    "repository_url" = "github_url"
WHERE "github_url" IS NOT NULL AND btrim("github_url") <> '';--> statement-breakpoint
UPDATE "projects"
SET "demo_available" = true,
    "demo_url" = "url"
WHERE "url" IS NOT NULL AND btrim("url") <> '';
