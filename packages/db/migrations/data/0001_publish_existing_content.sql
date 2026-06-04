-- Optional data backfill that pairs with migration 0001_content_workflow_seo_ai.
--
-- Context: before 0001, the tables below had no `status` column and were always
-- publicly visible. Migration 0001 adds `status NOT NULL DEFAULT 'draft'`, which
-- would retroactively hide every existing row from the public site (the public
-- queries only return status = 'published'). This script restores the previous
-- behavior by publishing rows that predate the workflow columns.
--
-- It is intentionally NOT part of the Drizzle migration journal so publishing is
-- an explicit decision rather than an automatic side effect of a schema upgrade.
--
-- Safety:
--   * Idempotent: only touches rows that are still draft with no publish stamp.
--   * On a fresh / empty database it updates zero rows and is a no-op.
--   * `projects` and `case_studies` are deliberately excluded — they already had
--     a real `status` before 0001 and their draft/published values are intentional.
--
-- Run once, after applying migration 0001, against a database that already held
-- pre-workflow content:
--   psql "$DATABASE_URL" -f packages/db/migrations/data/0001_publish_existing_content.sql

UPDATE "lenses"
  SET "status" = 'published', "published_at" = now()
  WHERE "status" = 'draft' AND "published_at" IS NULL;

UPDATE "principles"
  SET "status" = 'published', "published_at" = now()
  WHERE "status" = 'draft' AND "published_at" IS NULL;

UPDATE "decision_patterns"
  SET "status" = 'published', "published_at" = now()
  WHERE "status" = 'draft' AND "published_at" IS NULL;

UPDATE "experiences"
  SET "status" = 'published', "published_at" = now()
  WHERE "status" = 'draft' AND "published_at" IS NULL;

UPDATE "skills"
  SET "status" = 'published', "published_at" = now()
  WHERE "status" = 'draft' AND "published_at" IS NULL;

UPDATE "tags"
  SET "status" = 'published', "published_at" = now()
  WHERE "status" = 'draft' AND "published_at" IS NULL;
