import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
  serial,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const states = pgTable("state", {
  fipsCode: integer("fips_code").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  border: jsonb("border"),
  abbreviation: varchar("abbreviation", { length: 2 }),
});

export const statesRelations = relations(states, ({ many }) => ({
  counties: many(counties),
  data: many(stateDatas),
}));

export const counties = pgTable("county", {
  geoId: varchar("geo_id", { length: 5 }).notNull().primaryKey(),
  fipsCode: integer("fips_code").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  border: jsonb("border"),
  stateId: integer("state_id")
    .notNull()
    .references(() => states.fipsCode),
});

export const countiesRelations = relations(counties, ({ one, many }) => ({
  state: one(states, {
    fields: [counties.stateId],
    references: [states.fipsCode],
  }),
  data: many(countyDatas),
}));

export const stateDatas = pgTable("state_data", {
  id: serial("id").notNull().primaryKey(),
  stateId: integer("state_id")
    .notNull()
    .references(() => states.fipsCode),
  category: varchar("category", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", { length: 255 }),
  dataSet: jsonb("data_set").notNull(),
});

export const stateDatasRelation = relations(stateDatas, ({ one }) => ({
  state: one(states, {
    fields: [stateDatas.stateId],
    references: [states.fipsCode],
  }),
}));

export const countyDatas = pgTable("county_data", {
  id: serial("id").notNull().primaryKey(),
  countyId: varchar("county_id", { length: 5 })
    .notNull()
    .references(() => counties.geoId),
  category: varchar("category", { length: 255 }),
  source: varchar("source", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  dataSet: jsonb("data_set").notNull(),
});

export const countyDataRelations = relations(countyDatas, ({ one }) => ({
  county: one(counties, {
    fields: [countyDatas.countyId],
    references: [counties.geoId],
  }),
}));

export const users = pgTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = pgTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = pgTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const hospitals = pgTable("hospital", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  stateFips: varchar("state_fips", { length: 2 }),
  countyFips: varchar("county_fips", { length: 3 }),
  county: varchar("county", { length: 100 }),
  type: varchar("type", { length: 100 }),
  owner: varchar("owner", { length: 255 }),
  beds: integer("beds"),
  trauma: varchar("trauma", { length: 50 }),
  population: integer("population"),
  naicsDesc: varchar("naics_desc", { length: 255 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  geocodedAt: timestamp("geocoded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hospitalsRelations = relations(hospitals, ({ one }) => ({
  county: one(counties, {
    fields: [hospitals.stateFips, hospitals.countyFips],
    references: [counties.stateId, counties.fipsCode],
  }),
}));

export const censusHealthcareData = pgTable(
  "census_healthcare_data",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    countyFips: varchar("county_fips", { length: 3 }).notNull(),
    industryCode: varchar("industry_code", { length: 10 }),
    industryName: varchar("industry_name", { length: 255 }),
    establishments: integer("establishments"),
    employees: integer("employees"),
    annualPayroll: integer("annual_payroll"),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCountyIdx: index("census_healthcare_state_county_idx").on(
      table.stateFips,
      table.countyFips,
    ),
  }),
);

export const blsHealthcareData = pgTable(
  "bls_healthcare_data",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    countyFips: varchar("county_fips", { length: 3 }).notNull(),
    seriesId: varchar("series_id", { length: 100 }).notNull(),
    dataPoints: jsonb("data_points").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCountyIdx: index("bls_healthcare_state_county_idx").on(
      table.stateFips,
      table.countyFips,
    ),
  }),
);
export const crimeData = pgTable(
  "crime_data",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    dataType: varchar("data_type", { length: 50 }).notNull(), // 'summarized', 'arrest_demographics', 'offense_yearly'
    crimeTypeSlug: varchar("crime_type_slug", { length: 100 }).notNull(),
    years: jsonb("years").notNull(), // array of years
    responseData: jsonb("response_data").notNull(), // the full API response
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCrimeTypeIdx: index("crime_data_state_type_idx").on(
      table.stateFips,
      table.crimeTypeSlug,
    ),
  }),
);

export const acsPopulationData = pgTable(
  "acs_population_data",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    countyFips: varchar("county_fips", { length: 3 }),
    year: integer("year").notNull(),
    data: jsonb("data").notNull(), // Store the entire ProcessedAcsData object
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCountyYearIdx: index("acs_population_state_county_year_idx").on(
      table.stateFips,
      table.countyFips,
      table.year,
    ),
  }),
);

export const blsData = pgTable(
  "bls_data",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    countyFips: varchar("county_fips", { length: 3 }).notNull(),
    yearlyData: jsonb("yearly_data").notNull(),
    industryMap: jsonb("industry_map").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCountyIdx: index("bls_data_state_county_idx").on(
      table.stateFips,
      table.countyFips,
    ),
  }),
);

// Relations
export const blsDataRelations = relations(blsData, ({ one }) => ({
  county: one(counties, {
    fields: [blsData.stateFips, blsData.countyFips],
    references: [counties.stateId, counties.fipsCode],
  }),
}));

// BLS QCEW
export const blsQcew = pgTable(
  "bls_qcew",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    countyFips: varchar("county_fips", { length: 3 }).notNull(),
    summaryData: jsonb("summary_data").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCountyIdx: index("bls_qcew_state_county_idx").on(
      table.stateFips,
      table.countyFips,
    ),
  }),
);

export const censusCbpData = pgTable(
  "census_cbp_data",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    countyFips: varchar("county_fips", { length: 3 }).notNull(),
    censusData: jsonb("census_data").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCountyIdx: index("census_cbp_state_county_idx").on(
      table.stateFips,
      table.countyFips,
    ),
  }),
);

export const fredSeries = pgTable("fred_series", {
  id: serial("id").primaryKey(),
  fredId: integer("fred_id").notNull().unique(),
  seriesData: jsonb("series_data").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const fredObservations = pgTable("fred_observations", {
  id: serial("id").primaryKey(),
  seriesCode: varchar("series_code", { length: 100 }).notNull().unique(),
  seriesName: varchar("series_name", { length: 255 }).notNull(),
  observationsData: jsonb("observations_data").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

export const hudData = pgTable(
  "hud_data",
  {
    id: serial("id").primaryKey(),
    stateFips: varchar("state_fips", { length: 2 }).notNull(),
    countyFips: varchar("county_fips", { length: 3 }).notNull(),
    hudData: jsonb("hud_data").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => ({
    stateCountyIdx: index("hud_data_state_county_idx").on(
      table.stateFips,
      table.countyFips,
    ),
  }),
);
