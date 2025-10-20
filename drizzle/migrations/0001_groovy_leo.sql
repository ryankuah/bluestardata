CREATE TABLE IF NOT EXISTS "acs_population_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"county_fips" varchar(3),
	"year" integer NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bls_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"county_fips" varchar(3) NOT NULL,
	"yearly_data" jsonb NOT NULL,
	"industry_map" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bls_healthcare_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"county_fips" varchar(3) NOT NULL,
	"series_id" varchar(100) NOT NULL,
	"data_points" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bls_qcew" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"county_fips" varchar(3) NOT NULL,
	"summary_data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "census_healthcare_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"county_fips" varchar(3) NOT NULL,
	"industry_code" varchar(10),
	"industry_name" varchar(255),
	"establishments" integer,
	"employees" integer,
	"annual_payroll" integer,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crime_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"crime_type_slug" varchar(100) NOT NULL,
	"years" jsonb NOT NULL,
	"response_data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hospital" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"city" varchar(100),
	"state" varchar(2),
	"state_fips" varchar(2),
	"county_fips" varchar(3),
	"county" varchar(100),
	"type" varchar(100),
	"owner" varchar(255),
	"beds" integer,
	"trauma" varchar(50),
	"population" integer,
	"naics_desc" varchar(255),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"geocoded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "acs_population_state_county_year_idx" ON "acs_population_data" USING btree ("state_fips","county_fips","year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bls_data_state_county_idx" ON "bls_data" USING btree ("state_fips","county_fips");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bls_healthcare_state_county_idx" ON "bls_healthcare_data" USING btree ("state_fips","county_fips");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bls_qcew_state_county_idx" ON "bls_qcew" USING btree ("state_fips","county_fips");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "census_healthcare_state_county_idx" ON "census_healthcare_data" USING btree ("state_fips","county_fips");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crime_data_state_type_idx" ON "crime_data" USING btree ("state_fips","crime_type_slug");--> statement-breakpoint
ALTER TABLE "county_data" DROP COLUMN IF EXISTS "fetched_at";--> statement-breakpoint
ALTER TABLE "county_data" DROP COLUMN IF EXISTS "expires_at";--> statement-breakpoint
ALTER TABLE "county_data" DROP COLUMN IF EXISTS "fetch_status";--> statement-breakpoint
ALTER TABLE "county_data" DROP COLUMN IF EXISTS "last_error";--> statement-breakpoint
ALTER TABLE "state_data" DROP COLUMN IF EXISTS "fetched_at";--> statement-breakpoint
ALTER TABLE "state_data" DROP COLUMN IF EXISTS "expires_at";--> statement-breakpoint
ALTER TABLE "state_data" DROP COLUMN IF EXISTS "fetch_status";--> statement-breakpoint
ALTER TABLE "state_data" DROP COLUMN IF EXISTS "last_error";