CREATE TYPE "public"."quote_status" AS ENUM('NEW', 'ANSWERED', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"product_id" text,
	"product_name" text NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"selections" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"access_token" text NOT NULL,
	"status" "quote_status" DEFAULT 'NEW' NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"governorate" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"deadline" text DEFAULT '' NOT NULL,
	"indicative_total" integer DEFAULT 0 NOT NULL,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_number_unique" UNIQUE("number"),
	CONSTRAINT "quotes_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "quote_item_id" text;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quotes_created_idx" ON "quotes" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_quote_item_id_quote_items_id_fk" FOREIGN KEY ("quote_item_id") REFERENCES "public"."quote_items"("id") ON DELETE set null ON UPDATE no action;