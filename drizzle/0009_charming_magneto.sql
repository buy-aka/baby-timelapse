CREATE TABLE "video_download" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"baby_id" uuid NOT NULL,
	"downloaded_by" text,
	"frame_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_download" ADD CONSTRAINT "video_download_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_download" ADD CONSTRAINT "video_download_baby_id_baby_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."baby"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_download" ADD CONSTRAINT "video_download_downloaded_by_user_id_fk" FOREIGN KEY ("downloaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "video_download_family_idx" ON "video_download" USING btree ("family_id","created_at");