CREATE TABLE "album_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"uploaded_by" text,
	"file_name" text NOT NULL,
	"size" integer NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album_photo" ADD CONSTRAINT "album_photo_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_photo" ADD CONSTRAINT "album_photo_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_photo_family_idx" ON "album_photo" USING btree ("family_id","created_at");--> statement-breakpoint
CREATE INDEX "album_photo_file_name_idx" ON "album_photo" USING btree ("file_name");--> statement-breakpoint
CREATE INDEX "baby_photos_file_name_idx" ON "baby_photos" USING btree ("file_name");