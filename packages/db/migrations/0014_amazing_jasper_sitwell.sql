CREATE TABLE "homepage_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_label" varchar(180),
	"headline" text,
	"summary" text,
	"primary_cta_label" varchar(120),
	"primary_cta_href" varchar(240),
	"secondary_cta_label" varchar(120),
	"secondary_cta_href" varchar(240),
	"code_role_label" varchar(180),
	"code_mindset_label" varchar(220),
	"code_location_label" varchar(180),
	"code_experience_label" varchar(120),
	"code_focus_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metric_cards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_skill_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_principle_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_case_study_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured_recognition_experience_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "homepage_settings" ADD CONSTRAINT "homepage_settings_featured_recognition_experience_id_experiences_id_fk" FOREIGN KEY ("featured_recognition_experience_id") REFERENCES "public"."experiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "homepage_settings_updated_at_idx" ON "homepage_settings" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "homepage_settings_recognition_experience_idx" ON "homepage_settings" USING btree ("featured_recognition_experience_id");