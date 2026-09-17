CREATE TYPE "public"."emblem_group" AS ENUM('organisation', 'sport', 'region', 'autre');--> statement-breakpoint
CREATE TABLE "emblems" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name_fr" text NOT NULL,
	"name_ar" text NOT NULL,
	"group" "emblem_group" DEFAULT 'organisation' NOT NULL,
	"image" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emblems_code_unique" UNIQUE("code")
);
