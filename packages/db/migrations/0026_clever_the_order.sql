CREATE TABLE "site_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_name" text DEFAULT 'Huseyin Bozkurt' NOT NULL,
	"brand_logo_image_id" uuid,
	"show_brand_name" boolean DEFAULT true NOT NULL,
	"brand_logo_size" integer DEFAULT 28 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_brand_logo_size_chk" CHECK ("site_settings"."brand_logo_size" between 16 and 96)
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_brand_logo_image_id_site_images_id_fk" FOREIGN KEY ("brand_logo_image_id") REFERENCES "public"."site_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_images_created_at_idx" ON "site_images" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_images_updated_at_idx" ON "site_images" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "site_settings_updated_at_idx" ON "site_settings" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "site_settings_brand_logo_image_idx" ON "site_settings" USING btree ("brand_logo_image_id");
