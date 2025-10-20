CREATE TABLE IF NOT EXISTS "census_cbp_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"county_fips" varchar(3) NOT NULL,
	"census_data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "census_cbp_state_county_idx" ON "census_cbp_data" USING btree ("state_fips","county_fips");