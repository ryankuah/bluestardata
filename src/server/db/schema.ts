import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
  serial,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `bluestardata_${name}`);

export const countries = createTable("country", {
  id: serial("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const states = createTable("state", {
  id: serial("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  countryId: integer("country_id")
    .notNull()
    .references(() => countries.id),
  fredId: integer("fred_id").notNull().unique(),
});

export const counties = createTable("county", {
  id: serial("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  stateId: integer("state_id")
    .notNull()
    .references(() => states.id),
  fredId: integer("fred_id").notNull().unique(),
});

export const msas = createTable("msa", {
  id: serial("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  stateId: integer("state_id")
    .notNull()
    .references(() => states.id),
  fredId: integer("fred_id").notNull().unique(),
});

export const fredData = createTable("fred_data", {
  id: serial("id").notNull().primaryKey(),
  seriesCode: varchar("series_code", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  type: varchar("type", { length: 255 }),
  countryId: integer("country_id").references(() => countries.id),
  stateId: integer("state_id").references(() => states.id),
  countyId: integer("county_id").references(() => counties.id),
  msaId: integer("msa_id").references(() => msas.id),
});

export const countriesRelations = relations(countries, ({ many }) => ({
  states: many(states),
  fredData: many(fredData),
}));

export const statesRelations = relations(states, ({ many, one }) => ({
  counties: many(counties),
  msas: many(msas),
  fredData: many(fredData),
  country: one(countries, {
    fields: [states.countryId],
    references: [countries.id],
  }),
}));

export const msasRelations = relations(msas, ({ many, one }) => ({
  fredData: many(fredData),
  state: one(states, {
    fields: [msas.stateId],
    references: [states.id],
  }),
}));

export const countiesRelations = relations(counties, ({ many, one }) => ({
  fredData: many(fredData),
  state: one(states, {
    fields: [counties.stateId],
    references: [states.id],
  }),
}));

export const fredDataRelations = relations(fredData, ({ one }) => ({
  country: one(countries, {
    fields: [fredData.countryId],
    references: [countries.id],
  }),
  state: one(states, {
    fields: [fredData.stateId],
    references: [states.id],
  }),
  county: one(counties, {
    fields: [fredData.countyId],
    references: [counties.id],
  }),
  msa: one(msas, {
    fields: [fredData.msaId],
    references: [msas.id],
  }),
}));

export const users = createTable("user", {
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

export const accounts = createTable(
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

export const sessions = createTable(
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

export const verificationTokens = createTable(
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
