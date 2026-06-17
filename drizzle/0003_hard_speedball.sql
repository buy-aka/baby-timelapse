CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"invited_by" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitation_family_idx" ON "invitation" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");