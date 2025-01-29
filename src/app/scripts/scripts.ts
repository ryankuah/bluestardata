"use server";

import { db } from "@/server/db";
import { states, counties } from "@/server/db/schema";
import { type FeatureCollection as GeoJSON } from "geojson";
import countyFile from "./counties.json";
import stateFile from "./states.json";
import { fetchCategories } from "@/utils/fred/utils";

export async function addStateData() {
  const fips = (await fetch(
    "https://api.census.gov/data/2023/geoinfo?get=NAME&for=state:*",
  ).then((res) => res.json())) as [string, number][];

  const stateBorders = (stateFile as GeoJSON).features;

  for (const code of fips.slice(1)) {
    const border = stateBorders.find(
      (border) => border.properties?.name === code[0],
    );

    if (!border) {
      console.log("No border found for state", code[0]);
      continue;
    }

    const strippedBorder = {
      type: "Feature",
      geometry: border.geometry,
    };

    await db.insert(states).values({
      fipsCode: code[1],
      name: code[0],
      border: strippedBorder,
      abbreviation: border.id as unknown as string,
    });
  }
}

export async function addCountyData() {
  const countyData = (countyFile as GeoJSON).features;
  let count = 0;
  for (const county of countyData) {
    console.log(count);
    count++;
    const border = {
      type: "Feature",
      geometry: county.geometry,
    };

    const geoId = createCountyFips(
      county.properties!.STATEFP as unknown as number,
      county.properties!.COUNTYFP as unknown as number,
    );

    await db
      .insert(counties)
      .values({
        geoId,
        name: county.properties!.NAME as string,
        stateId: county.properties!.STATEFP as unknown as number,
        border,
        fipsCode: county.properties!.COUNTYFP as unknown as number,
      })
      .onConflictDoNothing();
  }
}

function createCountyFips(
  stateFips: string | number,
  countyFips: string | number,
): string {
  const stateCode = String(stateFips).padStart(2, "0");
  const countyCode = String(countyFips).padStart(3, "0");

  if (stateCode.length !== 2 || countyCode.length !== 3) {
    throw new Error(
      `Invalid FIPS codes: state=${stateFips}, county=${countyFips}`,
    );
  }
  const fullFips = stateCode + countyCode;

  const testFips = Number(fullFips);

  if (isNaN(testFips) || testFips < 1000 || testFips > 99999) {
    throw new Error(`Invalid combined FIPS code: ${fullFips}`);
  }

  return fullFips;
}
