# Engineering Portfolio Platform

A production-oriented, data-driven engineering portfolio for `huseyinbozkurt.dev`. The platform is organized around lenses, operating principles, decision patterns, experience, projects, and case studies. It ships without seed data or mock content; empty tables render polished "coming soon" states.

## Architecture

- `apps/public-site`: read-only Next.js 15 App Router site for public visitors, SEO, navigation, lenses, case studies, and empty states.
- `apps/admin`: separate minimal Next.js 15 admin application for future content management and initial content entry.
- `packages/db`: Drizzle ORM schema, migrations, read queries, and admin mutations for PostgreSQL/Neon.
- `packages/types`: shared TypeScript models inferred from the database schema.
- `packages/validators`: shared Zod validators for admin forms and content contracts.

## Getting Started

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:push
pnpm dev
```

`pnpm dev` starts both Next.js applications:

- Public site: `http://localhost:3000`
- Admin app: `http://localhost:3001`

Run either app separately:

```bash
pnpm dev:public
pnpm dev:admin
```

## Admin LLM Configuration

The Admin overview can show online/offline status for configured LLM providers.
All LLM settings come from environment variables; API keys are only read on the
server and are never rendered in the UI.

Built-in providers:

```bash
LLM_PROVIDERS="openai,anthropic,deepseek"
LLM_STATUS_TIMEOUT_MS="3000"
LLM_ANALYSIS_TIMEOUT_MS="90000"
LLM_ANALYSIS_MAX_TOKENS="6000"

OPENAI_API_KEY="..."
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_STATUS_URL=""
OPENAI_MODEL="gpt-4o-mini"

ANTHROPIC_API_KEY="..."
ANTHROPIC_BASE_URL="https://api.anthropic.com/v1"
ANTHROPIC_STATUS_URL=""
ANTHROPIC_API_VERSION="2023-06-01"
ANTHROPIC_MODEL="claude-3-5-sonnet-latest"

DEEPSEEK_API_KEY="..."
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_STATUS_URL=""
DEEPSEEK_MODEL="deepseek-chat"
```

Custom or OpenAI-compatible endpoint:

```bash
CUSTOM_LLM_NAME="Local LLM"
CUSTOM_LLM_BASE_URL="http://localhost:11434/v1"
CUSTOM_LLM_STATUS_URL="http://localhost:11434/api/tags"
CUSTOM_LLM_API_KEY=""
CUSTOM_LLM_MODEL="llama3.1"
```

Multiple custom providers can be supplied as JSON. Use `apiKeyEnv` to point at
another environment variable instead of placing a secret inside the JSON.

```bash
CUSTOM_LLM_CONNECTIONS='[{"id":"ollama","name":"Ollama","provider":"custom","baseUrl":"http://localhost:11434/v1","statusUrl":"http://localhost:11434/api/tags","model":"llama3.1"}]'
```

## Local Database

The local database runs in Docker and is intended only for development. Production
uses Neon PostgreSQL through `DATABASE_URL`; no production database should run
through Docker.

Start PostgreSQL locally:

```bash
cp .env.example .env
docker compose up -d
```

The compose file uses PostgreSQL 17, a named persistent volume, automatic
restart policy, and environment-variable driven settings:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`

The default local connection string is:

```bash
DATABASE_URL="postgresql://portfolio:portfolio@localhost:5432/engineering_portfolio"
```

If port `5432` is already used on your machine, override the host port and
adjust `DATABASE_URL`:

```bash
POSTGRES_PORT=55432 docker compose up -d
DATABASE_URL="postgresql://portfolio:portfolio@localhost:55432/engineering_portfolio"
```

Run migrations against the configured database:

```bash
pnpm db:migrate
```

For local development, you can also push the current schema directly:

```bash
pnpm db:push
```

`db:push` is intended for local development and runs non-interactively. Use
migrations for shared environments and production.

Generate migrations after schema changes:

```bash
pnpm db:generate
```

Open Drizzle Studio:

```bash
pnpm db:studio
```

Drizzle Studio reads the same `DATABASE_URL`, so it works with local Docker
PostgreSQL or Neon depending on the environment.

## Database

The schema is defined in `packages/db/src/schema.ts` with Drizzle ORM and is
designed for PostgreSQL 17 locally and Neon PostgreSQL in production. It uses
relational tables, foreign keys, and junction tables for relationships. There
are no JSON blobs for entity relationships.

### Schema Source

- Drizzle schema: `packages/db/src/schema.ts`
- Migrations: `packages/db/migrations`
- Database package: `@portfolio/db`
- Drizzle config: `packages/db/drizzle.config.ts`
- Connection variable: `DATABASE_URL`

### Enum Types

#### `content_status`

| Value | Meaning |
| --- | --- |
| `draft` | Editable content that is hidden from the public site. |
| `published` | Public content that can be rendered by the public site. |
| `archived` | Retained content that is hidden from the public site. |

The public site only reads `published` records. The admin app can read and edit
all statuses.

### Shared Column Groups

These groups are reused by multiple tables through Drizzle object spreads. The
expanded columns are listed in each table below as well.

#### Workflow Columns

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `status` | `content_status` | No | `'draft'` | Drives public visibility. |
| `published_at` | `timestamp with time zone` | Yes | none | Set when content is published. |
| `archived_at` | `timestamp with time zone` | Yes | none | Set when content is archived. |

#### SEO Columns

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `seo_title` | `text` | Yes | none | Optional page title override. |
| `seo_description` | `text` | Yes | none | Optional meta description override. |
| `og_image` | `text` | Yes | none | Optional Open Graph image URL. |

#### AI Metadata Columns

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `content_quality_score` | `integer` | Yes | none | Future review score. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | Future review timestamp. |
| `ai_summary` | `text` | Yes | none | Future generated summary. |
| `ai_suggestions` | `jsonb` | Yes | none | Future review metadata, not relationship storage. |

`ai_suggestions` is `jsonb` because its review shape may evolve. Entity
relationships remain normalized through foreign keys and junction tables.

#### Timestamp Columns

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| `created_at` | `timestamp with time zone` | No | `now()` | Row creation timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Last update timestamp. |

### Core Content Tables

#### `lenses`

Represents a way to explore the portfolio, such as product building, team
leadership, reliability, systems design, or intelligence.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | No | none | Unique public URL slug. |
| `name` | `varchar(160)` | No | none | Display name. |
| `summary` | `text` | No | `''` | Public summary copy. |
| `accent_color` | `varchar(32)` | No | `'#7dd3fc'` | UI accent color. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `seo_title` | `text` | Yes | none | SEO override. |
| `seo_description` | `text` | Yes | none | SEO override. |
| `og_image` | `text` | Yes | none | Open Graph image URL. |
| `content_quality_score` | `integer` | Yes | none | AI metadata. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | AI metadata. |
| `ai_summary` | `text` | Yes | none | AI metadata. |
| `ai_suggestions` | `jsonb` | Yes | none | AI metadata. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `lenses_slug_idx`: unique index on `slug`
- `lenses_status_idx`: index on `status`
- `lenses_position_idx`: index on `position`

#### `principles`

Represents operating principles and ways of working.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | No | none | Unique public URL slug. |
| `title` | `varchar(180)` | No | none | Display title. |
| `summary` | `text` | No | `''` | Public summary copy. |
| `body` | `text` | No | `''` | Markdown body content. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `seo_title` | `text` | Yes | none | SEO override. |
| `seo_description` | `text` | Yes | none | SEO override. |
| `og_image` | `text` | Yes | none | Open Graph image URL. |
| `content_quality_score` | `integer` | Yes | none | AI metadata. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | AI metadata. |
| `ai_summary` | `text` | Yes | none | AI metadata. |
| `ai_suggestions` | `jsonb` | Yes | none | AI metadata. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `principles_slug_idx`: unique index on `slug`
- `principles_status_idx`: index on `status`
- `principles_position_idx`: index on `position`

#### `decision_patterns`

Represents repeatable decision-making patterns and trade-off heuristics.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | No | none | Unique public URL slug. |
| `title` | `varchar(180)` | No | none | Display title. |
| `summary` | `text` | No | `''` | Public summary copy. |
| `body` | `text` | No | `''` | Markdown body content. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `seo_title` | `text` | Yes | none | SEO override. |
| `seo_description` | `text` | Yes | none | SEO override. |
| `og_image` | `text` | Yes | none | Open Graph image URL. |
| `content_quality_score` | `integer` | Yes | none | AI metadata. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | AI metadata. |
| `ai_summary` | `text` | Yes | none | AI metadata. |
| `ai_suggestions` | `jsonb` | Yes | none | AI metadata. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `decision_patterns_slug_idx`: unique index on `slug`
- `decision_patterns_status_idx`: index on `status`
- `decision_patterns_position_idx`: index on `position`

#### `experiences`

Represents professional experience entries. Public experience pages are
available at `/experience/[slug]`; if a slug is missing, the application can
fall back to the record id.

Experience lists are ordered reverse chronologically: current roles first, then
newest `start_date`, then newest `end_date`, with undated records last.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | Yes | none | Optional unique public URL slug. |
| `company` | `varchar(180)` | No | none | Company name. |
| `role` | `varchar(180)` | No | none | Role title. |
| `location` | `varchar(160)` | Yes | none | Optional location. |
| `start_date` | `date` | Yes | none | Start date. |
| `end_date` | `date` | Yes | none | End date. |
| `is_current` | `boolean` | No | `false` | Current role flag. |
| `summary` | `text` | No | `''` | Public summary copy. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `seo_title` | `text` | Yes | none | SEO override. |
| `seo_description` | `text` | Yes | none | SEO override. |
| `og_image` | `text` | Yes | none | Open Graph image URL. |
| `content_quality_score` | `integer` | Yes | none | AI metadata. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | AI metadata. |
| `ai_summary` | `text` | Yes | none | AI metadata. |
| `ai_suggestions` | `jsonb` | Yes | none | AI metadata. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `experiences_slug_idx`: unique index on `slug`
- `experiences_status_idx`: index on `status`
- `experiences_date_idx`: index on `start_date`, `end_date`
- `experiences_position_idx`: index on `position`

#### `projects`

Represents engineering projects and their primary URLs.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | No | none | Unique public URL slug. |
| `name` | `varchar(180)` | No | none | Project name. |
| `description` | `text` | No | `''` | Public description. |
| `url` | `text` | Yes | none | Optional live URL. |
| `github_url` | `text` | Yes | none | Optional source URL. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `seo_title` | `text` | Yes | none | SEO override. |
| `seo_description` | `text` | Yes | none | SEO override. |
| `og_image` | `text` | Yes | none | Open Graph image URL. |
| `content_quality_score` | `integer` | Yes | none | AI metadata. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | AI metadata. |
| `ai_summary` | `text` | Yes | none | AI metadata. |
| `ai_suggestions` | `jsonb` | Yes | none | AI metadata. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `projects_slug_idx`: unique index on `slug`
- `projects_status_idx`: index on `status`
- `projects_position_idx`: index on `position`

#### `project_links`

Stores additional links for a project.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `project_id` | `uuid` | No | none | Foreign key to `projects.id` with `ON DELETE CASCADE`. |
| `label` | `varchar(100)` | No | none | Link label. |
| `url` | `text` | No | none | Link URL. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `project_links_project_idx`: index on `project_id`

#### `case_studies`

The primary portfolio content type. Case studies explain context, decisions,
trade-offs, outcomes, and learning.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | No | none | Unique public URL slug. |
| `title` | `varchar(220)` | No | none | Display title. |
| `excerpt` | `text` | No | `''` | Public excerpt. |
| `context` | `text` | No | `''` | Markdown content. |
| `problem` | `text` | No | `''` | Markdown content. |
| `constraints` | `text` | No | `''` | Markdown content. |
| `action` | `text` | No | `''` | Markdown content. |
| `tradeoffs` | `text` | No | `''` | Markdown content. |
| `outcome` | `text` | No | `''` | Markdown content. |
| `learning` | `text` | No | `''` | Markdown content. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `seo_title` | `text` | Yes | none | SEO override. |
| `seo_description` | `text` | Yes | none | SEO override. |
| `og_image` | `text` | Yes | none | Open Graph image URL. |
| `content_quality_score` | `integer` | Yes | none | AI metadata. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | AI metadata. |
| `ai_summary` | `text` | Yes | none | AI metadata. |
| `ai_suggestions` | `jsonb` | Yes | none | AI metadata. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `case_studies_slug_idx`: unique index on `slug`
- `case_studies_status_idx`: index on `status`
- `case_studies_position_idx`: index on `position`

#### `skills`

Represents technologies, practices, and capability labels used to connect work.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | No | none | Unique slug. |
| `name` | `varchar(140)` | No | none | Display name. |
| `category` | `varchar(120)` | Yes | none | Optional grouping. |
| `summary` | `text` | No | `''` | Public summary copy. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `content_quality_score` | `integer` | Yes | none | AI metadata. |
| `last_ai_review_at` | `timestamp with time zone` | Yes | none | AI metadata. |
| `ai_summary` | `text` | Yes | none | AI metadata. |
| `ai_suggestions` | `jsonb` | Yes | none | AI metadata. |
| `position` | `integer` | No | `0` | Manual ordering. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `skills_slug_idx`: unique index on `slug`
- `skills_status_idx`: index on `status`
- `skills_category_idx`: index on `category`
- `skills_position_idx`: index on `position`

#### `tags`

Represents lightweight categorization labels.

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key. |
| `slug` | `varchar(120)` | No | none | Unique slug. |
| `name` | `varchar(140)` | No | none | Display name. |
| `category` | `varchar(120)` | Yes | none | Optional grouping. |
| `status` | `content_status` | No | `'draft'` | Workflow status. |
| `published_at` | `timestamp with time zone` | Yes | none | Published timestamp. |
| `archived_at` | `timestamp with time zone` | Yes | none | Archived timestamp. |
| `created_at` | `timestamp with time zone` | No | `now()` | Timestamp. |
| `updated_at` | `timestamp with time zone` | No | `now()` | Timestamp. |

Indexes:

- `tags_slug_idx`: unique index on `slug`
- `tags_status_idx`: index on `status`
- `tags_category_idx`: index on `category`

### Relationship Tables

The schema uses many-to-many junction tables with composite primary keys and
foreign keys with `ON DELETE CASCADE`. Deleting a parent row removes its join
rows but does not delete the related entity on the other side.

#### `experience_lenses`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `experience_id` | `uuid` | No | none | Foreign key to `experiences.id` with `ON DELETE CASCADE`. |
| `lens_id` | `uuid` | No | none | Foreign key to `lenses.id` with `ON DELETE CASCADE`. |
| `relevance_score` | `integer` | Yes | none | Optional ranking metadata. |

Primary key: composite primary key on `experience_id`, `lens_id`.

#### `experience_principles`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `experience_id` | `uuid` | No | none | Foreign key to `experiences.id` with `ON DELETE CASCADE`. |
| `principle_id` | `uuid` | No | none | Foreign key to `principles.id` with `ON DELETE CASCADE`. |
| `relevance_score` | `integer` | Yes | none | Optional ranking metadata. |

Primary key: composite primary key on `experience_id`, `principle_id`.

#### `experience_skills`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `experience_id` | `uuid` | No | none | Foreign key to `experiences.id` with `ON DELETE CASCADE`. |
| `skill_id` | `uuid` | No | none | Foreign key to `skills.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `experience_id`, `skill_id`.

#### `experience_tags`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `experience_id` | `uuid` | No | none | Foreign key to `experiences.id` with `ON DELETE CASCADE`. |
| `tag_id` | `uuid` | No | none | Foreign key to `tags.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `experience_id`, `tag_id`.

#### `project_lenses`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `project_id` | `uuid` | No | none | Foreign key to `projects.id` with `ON DELETE CASCADE`. |
| `lens_id` | `uuid` | No | none | Foreign key to `lenses.id` with `ON DELETE CASCADE`. |
| `relevance_score` | `integer` | Yes | none | Optional ranking metadata. |

Primary key: composite primary key on `project_id`, `lens_id`.

#### `project_principles`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `project_id` | `uuid` | No | none | Foreign key to `projects.id` with `ON DELETE CASCADE`. |
| `principle_id` | `uuid` | No | none | Foreign key to `principles.id` with `ON DELETE CASCADE`. |
| `relevance_score` | `integer` | Yes | none | Optional ranking metadata. |

Primary key: composite primary key on `project_id`, `principle_id`.

#### `project_skills`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `project_id` | `uuid` | No | none | Foreign key to `projects.id` with `ON DELETE CASCADE`. |
| `skill_id` | `uuid` | No | none | Foreign key to `skills.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `project_id`, `skill_id`.

#### `project_tags`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `project_id` | `uuid` | No | none | Foreign key to `projects.id` with `ON DELETE CASCADE`. |
| `tag_id` | `uuid` | No | none | Foreign key to `tags.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `project_id`, `tag_id`.

#### `case_study_lenses`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `case_study_id` | `uuid` | No | none | Foreign key to `case_studies.id` with `ON DELETE CASCADE`. |
| `lens_id` | `uuid` | No | none | Foreign key to `lenses.id` with `ON DELETE CASCADE`. |
| `relevance_score` | `integer` | Yes | none | Optional ranking metadata. |

Primary key: composite primary key on `case_study_id`, `lens_id`.

#### `case_study_principles`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `case_study_id` | `uuid` | No | none | Foreign key to `case_studies.id` with `ON DELETE CASCADE`. |
| `principle_id` | `uuid` | No | none | Foreign key to `principles.id` with `ON DELETE CASCADE`. |
| `relevance_score` | `integer` | Yes | none | Optional ranking metadata. |

Primary key: composite primary key on `case_study_id`, `principle_id`.

#### `case_study_experiences`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `case_study_id` | `uuid` | No | none | Foreign key to `case_studies.id` with `ON DELETE CASCADE`. |
| `experience_id` | `uuid` | No | none | Foreign key to `experiences.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `case_study_id`, `experience_id`.

#### `case_study_projects`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `case_study_id` | `uuid` | No | none | Foreign key to `case_studies.id` with `ON DELETE CASCADE`. |
| `project_id` | `uuid` | No | none | Foreign key to `projects.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `case_study_id`, `project_id`.

#### `case_study_skills`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `case_study_id` | `uuid` | No | none | Foreign key to `case_studies.id` with `ON DELETE CASCADE`. |
| `skill_id` | `uuid` | No | none | Foreign key to `skills.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `case_study_id`, `skill_id`.

#### `case_study_tags`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `case_study_id` | `uuid` | No | none | Foreign key to `case_studies.id` with `ON DELETE CASCADE`. |
| `tag_id` | `uuid` | No | none | Foreign key to `tags.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `case_study_id`, `tag_id`.

#### `decision_pattern_principles`

| Column | Type | Nullable | Default | Constraints / Notes |
| --- | --- | --- | --- | --- |
| `decision_pattern_id` | `uuid` | No | none | Foreign key to `decision_patterns.id` with `ON DELETE CASCADE`. |
| `principle_id` | `uuid` | No | none | Foreign key to `principles.id` with `ON DELETE CASCADE`. |

Primary key: composite primary key on `decision_pattern_id`, `principle_id`.

### Public App Read Model

The public site uses read-only queries from `packages/db/src/queries.ts`.

Important public behaviors:

- Only `published` records render publicly.
- Empty tables render empty-state UI instead of errors.
- Home content aggregates published lenses, principles, decision patterns,
  experiences, projects, and case studies.
- Experience detail pages include related lenses, principles, skills, case
  studies, and projects.
- Lens detail pages include related published case studies, experiences,
  projects, and principles.
- Case study pages include related lenses, principles, experience, projects,
  skills, and tags.

### Admin App Write Model

The admin app uses mutation functions from `packages/db/src/mutations.ts` and
Zod validators from `packages/validators/src/index.ts`.

Admin responsibilities:

- Create and edit all core content tables.
- Manage status transitions between draft, published, and archived.
- Manage normalized relationships through checkbox-driven relation ids.
- Group skills and tags by `category` in taxonomy lists and relation pickers.
- Bulk create or edit skills and tags from the admin UI; bulk saves upsert by `slug`.
- Keep write capabilities out of the public site.

### Rich Text

Rich content fields are currently stored as `text` and rendered as Markdown in
the public site. This keeps the schema simple while leaving room to introduce
MDX or a richer editor later without changing relationship modeling.

## Deployment Notes

- Public site target: Vercel.
- Database target: PostgreSQL with Neon-compatible connection strings.
- Public site has no admin routes, no write APIs, and no embedded CMS.
- Set `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL` in Vercel.
- Set `DATABASE_URL` to the Neon connection string in production, usually with
  `sslmode=require`.
- Keep Docker Compose limited to local development.

## Future Extensions

- Add auth and role-based access control to the admin app.
- Add media assets and image optimization for case studies.
- Add on-demand revalidation hooks after admin writes.
- Add richer editor support for Markdown/MDX content sections.
- Add analytics and search once real content exists.
