CREATE TABLE "contact_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_label" varchar(180),
	"availability_label" text,
	"timezone_label" varchar(120),
	"response_time_label" varchar(180),
	"linkedin_url" text,
	"github_url" text,
	"email_address" varchar(320),
	"resume_url" text,
	"short_contact_intro" text,
	"open_to_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "mode" varchar(40) DEFAULT 'technical' NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "intent" varchar(80) DEFAULT 'collaboration' NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "company" varchar(180);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "role_title" varchar(180);--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "tech_stack" text;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "problem" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "desired_outcome" text;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD COLUMN "timeline" varchar(180);--> statement-breakpoint
CREATE INDEX "contact_profiles_updated_at_idx" ON "contact_profiles" USING btree ("updated_at");
