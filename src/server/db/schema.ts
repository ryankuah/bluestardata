import { relations } from "drizzle-orm";
import { integer, pgTable, varchar, serial, jsonb } from "drizzle-orm/pg-core";

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
