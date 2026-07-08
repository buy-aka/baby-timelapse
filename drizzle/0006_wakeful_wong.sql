CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"plan" text,
	"requested_plan" text,
	"requested_amount_mnt" integer,
	"payment_reference" text,
	"trial_ends_at" timestamp NOT NULL,
	"period_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_family_id_unique" UNIQUE("family_id"),
	CONSTRAINT "subscription_payment_reference_unique" UNIQUE("payment_reference")
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_family_id_family_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."family"("id") ON DELETE cascade ON UPDATE no action;