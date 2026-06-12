CREATE TABLE "project_evidence_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_evidence_assets" ADD CONSTRAINT "project_evidence_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_evidence_assets_project_idx" ON "project_evidence_assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_evidence_assets_uploaded_at_idx" ON "project_evidence_assets" USING btree ("uploaded_at");