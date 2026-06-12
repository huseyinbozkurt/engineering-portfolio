CREATE TABLE "ai_review_quality_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" varchar(40) NOT NULL,
	"content_id" uuid NOT NULL,
	"content_title" varchar(220) NOT NULL,
	"quality_score" integer NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_review_quality_snapshots_content_idx" ON "ai_review_quality_snapshots" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "ai_review_quality_snapshots_reviewed_at_idx" ON "ai_review_quality_snapshots" USING btree ("reviewed_at");