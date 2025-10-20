CREATE TABLE IF NOT EXISTS "hud_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"state_fips" varchar(2) NOT NULL,
	"county_fips" varchar(3) NOT NULL,
	"hud_data" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hud_data_state_county_idx" ON "hud_data" USING btree ("state_fips","county_fips");