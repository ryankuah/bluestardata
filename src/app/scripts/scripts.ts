"use server";

import { db } from "@/server/db";
import { countries, states, counties, msas } from "@/server/db/schema";
import { fetchCategories } from "@/utils";
import { type FeatureCollection as GeoJSON } from "geojson";
import countyBorders from "./counties.json";
import stateBorders from "./states.json";
import { eq, sql } from "drizzle-orm";

export async function addUSA() {
  await db.insert(countries).values({
    name: "United States",
    id: 1,
  });
}

export async function fredStates() {
  const allStates = await fetchCategories(27281);
  for (const state of allStates) {
    const returnedId = await db
      .insert(states)
      .values({
        name: state.name,
        countryId: 1,
        fredId: state.id,
      })
      .returning({ insertedId: states.id })
      .onConflictDoNothing();
    const id =
      returnedId[0]?.insertedId ??
      (
        await db.query.states.findFirst({
          where: (states, { eq }) => eq(states.name, state.name),
        })
      )?.id;
    if (!id) {
      console.log("No id found for state", state.name);
      continue;
    }
    const stateOptions = await fetchCategories(state.id);
    let countiesId;
    let msasId;
    stateOptions.forEach((option) => {
      if (option.name === "Counties") {
        countiesId = option.id;
      } else if (option.name === "MSAs") {
        msasId = option.id;
      }
    });
    if (countiesId) {
      await fredState(countiesId, id);
    }
    if (msasId) {
      await fredMSA(msasId, id);
    }
  }
}

async function fredState(code: number, stateId: number) {
  const allCounties = await fetchCategories(code);
  for (const county of allCounties) {
    await db
      .insert(counties)
      .values({
        name: county.name,
        stateId: stateId,
        fredId: county.id,
      })
      .onConflictDoNothing();
  }
}
async function fredMSA(code: number, stateId: number) {
  const allMSAs = await fetchCategories(code);
  for (const msa of allMSAs) {
    await db
      .insert(msas)
      .values({
        name: msa.name,
        stateId: stateId,
        fredId: msa.id,
      })
      .onConflictDoNothing();
  }
}

export async function addStateBorders() {
  const data = stateBorders as GeoJSON;

  for (const feature of data.features) {
    await db
      .update(states)
      .set({ stateBorder: feature })
      .where(eq(states.name, feature.properties!.name as string));
  }
}

export async function addCountyBorders() {
  const data = countyBorders as GeoJSON;

  const stateFips = await db.query.states.findMany({
    columns: {
      fipsCode: true,
      id: true,
    },
  });

  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  for (const feature of data.features) {
    const properties = feature.properties;
    if (!properties?.NAME) {
      continue;
    }
    const nameToSearch = properties.NAME as string;

    const result = await db
      .select({
        id: counties.id,
        similarity: sql<number>`similarity(${counties.name}, ${nameToSearch})`,
        stateId: counties.stateId,
        name: counties.name,
      })
      .from(counties)
      .orderBy(sql`similarity(${counties.name}, ${nameToSearch}) DESC`)
      .limit(10);

    let answer = result[0];

    for (const item of result) {
      const code = stateFips.find(
        (state) => state.id === item.stateId,
      )?.fipsCode;
      if (code === properties.STATEFP) {
        answer = item;
      }
    }

    await db
      .update(counties)
      .set({ countyBorder: feature })
      .where(eq(counties.name, answer!.name));
  }
  console.log("Done!");
}

export async function addFPCodes() {
  const fips = (await fetch(
    "https://api.census.gov/data/2010/dec/sf1?get=NAME&for=state:*",
  ).then((res) => res.json())) as [string, number][];
  console.log(fips);
  for (const code of fips) {
    if (code[0] === "NAME") continue;
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    const result = await db
      .select({
        id: states.id,
        similarity: sql<number>`similarity(${states.name}, ${code[0]})`,
        name: states.name,
      })
      .from(states)
      .orderBy(sql`similarity(${states.name}, ${code[0]}) DESC`)
      .limit(10);

    console.log(code[0], code[1], result);
    console.log("sdfs");

    await db
      .update(states)
      .set({ fipsCode: code[1] })
      .where(eq(states.name, result[0]!.name));
  }
}

export async function addUSData() {
  const fredIDs = await fetchCategories(27281);
  const fips = (await fetch(
    "https://api.census.gov/data/2010/dec/sf1?get=NAME&for=state:*",
  ).then((res) => res.json())) as [string, number][];
  const stateFeatures = stateBorders.features;

  for (const feature of stateFeatures) {
    await db
      .insert(states)
      .values({
        name: feature.properties.name,
        countryId: 1,
        fredId: fredIDs.find((fred) => fred.name === feature.properties.name)
          ?.id,
        stateBorder: feature,
        fipsCode: fips.find(
          (state) => state[0] === feature.properties.name,
        )?.[1],
      })
      .onConflictDoNothing();
  }
}

export async function addUSCountyData() {
  console.log("start");
  const dbStates = await db.query.states.findMany();
  const countyFeatures = countyBorders.features;
  for (const feature of countyFeatures) {
    const stateFP = parseInt(feature.properties.STATEFP);
    const state = dbStates.find((state) => state.fipsCode === stateFP);
    if (!state) {
      console.log("No state found for fips code", feature.properties.STATEFP);
      continue;
    }
    const stateFreds = await fetchCategories(state.fredId!);
    const countyID = stateFreds.find(
      (selection) =>
        selection.name === "Counties" ||
        selection.name === "Parishes" ||
        selection.name === "Census Areas and Boroughs",
    )?.id;
    if (!countyID) {
      console.log("No county id found for state", feature.properties.STATEFP);
      console.log(stateFreds);
      continue;
    }
    const countyFredID = await fetchCategories(countyID);
    const fredID = countyFredID.find((fred) =>
      fred.name
        .replace(/\s/g, "")
        .toLowerCase()
        .startsWith(feature.properties.NAME.replace(/\s/g, "").toLowerCase()),
    )?.id;
    if (!fredID) {
      console.log("No fred id found for county", feature.properties.NAME);
      continue;
    }

    await db
      .insert(counties)
      .values({
        name: feature.properties.NAME,
        stateId: state.id,
        fredId: fredID,
        countyBorder: feature,
        fipsCode: feature.properties.COUNTYFP as unknown as number,
        gnisId: feature.properties.COUNTYNS as unknown as number,
        lsad: feature.properties.LSAD as unknown as number,
        aland: feature.properties.ALAND as unknown as string,
        awater: feature.properties.AWATER as unknown as string,
      })
      .onConflictDoNothing();
  }
}

// export const counties = createTable("county", {
//   id: serial("id").notNull().primaryKey(),
//   name: varchar("name", { length: 255 }).notNull(),
//   stateId: integer("state_id")
//     .notNull()
//     .references(() => states.id),
//   fredId: integer("fred_id").unique(),
//   countyBorder: jsonb("county_border"),
//   fipsCode: integer("fips_code"),
//   gnisId: integer("gnis_id"),
//   lsad: integer("lsad"),
//   aland: integer("aland"),
//   awater: integer("awater"),
// });
