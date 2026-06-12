ALTER TABLE "projects" RENAME COLUMN "visibility" TO "portfolio_visibility";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "repository_visibility" TO "source_availability";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "source_availability" TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "source_availability" SET DEFAULT 'closed-source';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "release_status" varchar(30) DEFAULT 'in-development' NOT NULL;--> statement-breakpoint
UPDATE "projects"
SET "source_availability" = CASE
  WHEN "source_availability" = 'public' THEN 'open-source'
  WHEN "source_availability" = 'private' THEN 'closed-source'
  ELSE 'not-applicable'
END;--> statement-breakpoint
UPDATE "projects"
SET "repository_url" = NULL
WHERE "source_availability" <> 'open-source';--> statement-breakpoint
UPDATE "projects"
SET "release_status" = CASE
  WHEN "demo_available" = true
    OR ("demo_url" IS NOT NULL AND btrim("demo_url") <> '')
    OR ("url" IS NOT NULL AND btrim("url") <> '')
    THEN 'released'
  WHEN "project_status" = 'sunset' THEN 'sunset'
  WHEN "project_type" = 'internal-tool' THEN 'internal-only'
  WHEN "project_type" = 'experiment' THEN 'prototype'
  ELSE 'in-development'
END;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "demo_available";--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_repository_url_source_availability_chk" CHECK ("projects"."source_availability" = 'open-source' OR "projects"."repository_url" IS NULL OR btrim("projects"."repository_url") = '');--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_demo_url_release_status_chk" CHECK ("projects"."release_status" = 'released' OR "projects"."demo_url" IS NULL OR btrim("projects"."demo_url") = '');--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_url_release_status_chk" CHECK ("projects"."release_status" = 'released' OR "projects"."url" IS NULL OR btrim("projects"."url") = '');
