DROP INDEX "invitation_email_idx";--> statement-breakpoint
ALTER TABLE "invitation" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "phone" text;--> statement-breakpoint
CREATE INDEX "invitation_phone_idx" ON "invitation" USING btree ("phone");