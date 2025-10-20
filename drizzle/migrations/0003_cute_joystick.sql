CREATE TABLE IF NOT EXISTS "fred_observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_code" varchar(100) NOT NULL,
	"series_name" varchar(255) NOT NULL,
	"observations_data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now(),
	CONSTRAINT "fred_observations_series_code_unique" UNIQUE("series_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fred_series" (
	"id" serial PRIMARY KEY NOT NULL,
	"fred_id" integer NOT NULL,
	"series_data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now(),
	CONSTRAINT "fred_series_fred_id_unique" UNIQUE("fred_id")
);
