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
  data: jsonb("data").notNull(),
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
  name: varchar("name", { length: 255 }).notNull(),
  data: jsonb("data").notNull(),
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
