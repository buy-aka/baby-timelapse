CREATE TABLE "baby" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"name" text NOT NULL,
	"birth_date" date,
	"gender" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "baby_photos" ADD COLUMN "baby_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "baby_photos" ADD COLUMN "uploaded_by" text;--> statement-breakpoint
ALTER TABLE "baby" ADD CONSTRAINT "baby_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family" ADD CONSTRAINT "family_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_member" ADD CONSTRAINT "family_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "baby_family_idx" ON "baby" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX "family_member_unique" ON "family_member" USING btree ("family_id","user_id");--> statement-breakpoint
CREATE INDEX "family_member_user_idx" ON "family_member" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "baby_photos" ADD CONSTRAINT "baby_photos_baby_id_baby_id_fk" FOREIGN KEY ("baby_id") REFERENCES "public"."baby"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baby_photos" ADD CONSTRAINT "baby_photos_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "baby_photos_baby_date_idx" ON "baby_photos" USING btree ("baby_id","photo_date");