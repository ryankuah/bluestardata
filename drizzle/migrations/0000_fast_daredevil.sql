CREATE TABLE IF NOT EXISTS "account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "county" (
	"geo_id" varchar(5) PRIMARY KEY NOT NULL,
	"fips_code" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"border" jsonb,
	"state_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "county_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"county_id" varchar(5) NOT NULL,
	"category" varchar(255),
	"source" varchar(255),
	"name" varchar(255) NOT NULL,
	"data_set" jsonb NOT NULL,
	"fetched_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"fetch_status" varchar(20),
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "state_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_id" integer NOT NULL,
	"category" varchar(255),
	"name" varchar(255) NOT NULL,
	"source" varchar(255),
	"data_set" jsonb NOT NULL,
	"fetched_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"fetch_status" varchar(20),
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "state" (
	"fips_code" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"border" jsonb,
	"abbreviation" varchar(2)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "county" ADD CONSTRAINT "county_state_id_state_fips_code_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("fips_code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "county_data" ADD CONSTRAINT "county_data_county_id_county_geo_id_fk" FOREIGN KEY ("county_id") REFERENCES "public"."county"("geo_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "state_data" ADD CONSTRAINT "state_data_state_id_state_fips_code_fk" FOREIGN KEY ("state_id") REFERENCES "public"."state"("fips_code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" USING btree ("user_id");