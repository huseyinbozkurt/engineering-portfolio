-- Custom SQL migration file, put your code below! --

-- Backfill: copy historical AI Insights runs from the legacy `ai_insight_runs`
-- table into the unified `llm_runs` audit log so they appear in Admin → LLM Runs
-- alongside content/taxonomy review. New runs already write directly to
-- `llm_runs`; the public site reads `llm_runs` first and only falls back to the
-- legacy table when no consolidated record exists.
--
-- Notes:
--   * The original `id` is preserved, so this is idempotent (re-running inserts
--     nothing) and existing admin review links (`/ai-insights/runs/{id}`) keep
--     resolving against `llm_runs`.
--   * Provenance is unknown for legacy runs, so prompt/config sources are
--     recorded as the code/.env fallbacks they actually used.
--   * Only terminal runs are copied; stale `pending`/`running` rows are skipped
--     so they cannot resurrect as an active run blocking new generations.
--   * The legacy status enum is cast through text into `llm_run_status`.
INSERT INTO "llm_runs" (
  "id",
  "workflow",
  "target_type",
  "status",
  "provider",
  "model",
  "prompt_source",
  "config_source",
  "prompt_version",
  "prompt_system",
  "prompt_user",
  "input_snapshot",
  "raw_response",
  "output_json",
  "validation_notes",
  "token_usage",
  "attempts",
  "error_stage",
  "error_message",
  "started_at",
  "completed_at",
  "duration_ms",
  "published_at",
  "created_at",
  "updated_at"
)
SELECT
  air."id",
  'aiInsights',
  'portfolio',
  air."status"::text::"llm_run_status",
  air."provider",
  air."model",
  'codeFallback',
  'envFallback',
  air."prompt_version",
  air."prompt_system",
  air."prompt_user",
  air."input_snapshot",
  air."raw_response",
  air."output_json",
  air."validation_notes",
  air."token_usage",
  air."attempts",
  air."error_stage",
  air."error_message",
  air."started_at",
  air."completed_at",
  air."duration_ms",
  air."published_at",
  air."created_at",
  air."updated_at"
FROM "ai_insight_runs" air
WHERE air."status" IN ('succeeded', 'failed', 'published')
  AND NOT EXISTS (
    SELECT 1 FROM "llm_runs" lr WHERE lr."id" = air."id"
  );
