CREATE TABLE "baby_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_date" date NOT NULL,
	"file_name" text NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
