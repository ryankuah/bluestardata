"use server";
import { db } from "@/server/db";
import { states, counties } from "@/server/db/schema";
import { type FeatureCollection as GeoJSON } from "geojson";
import countyFile from "./counties.json";
import stateFile from "./states.json";
import { addCountyData as dbaddCountyData } from "@/utils/db/utils";
//import { privateSchools } from "./privatences"
import fs from "fs";

export async function addNCESData() {
  const csvContent = fs
    .readFileSync("./public/publicnces.csv", "utf-8")
    .split("\n")
    .slice(1);

  for (const school of csvContent) {
    const dataArray = school.split(",");
    const dataObject = {
      NCESSCH: dataArray[3],
      STABR: dataArray[5],
      LEAID: dataArray[6],
      STLEAID: dataArray[7],
      AGENCY: dataArray[8],
      NAME: dataArray[9],
      ADDRESS: dataArray[10], //there is a second addressline
      CITY: dataArray[12],
      ZIP: dataArray[13],
      ZIP4: dataArray[15],
      PHONE: dataArray[16],
      CHARTER: dataArray[17],
      VIRTUAL: dataArray[18],
      GRADELOWEST: dataArray[19],
      GRADEHIGHEST: dataArray[20],
      SCHOOLLEVEL: dataArray[21],
      SCHOOLTYPE: dataArray[23],
      STATUS: dataArray[24],
      LOCALE: dataArray[25],
      COUNTY: dataArray[26],
      FREELUNCH: dataArray[29],
      REDUCELUNCH: dataArray[30],
      DIRECTCERT: dataArray[31],
      PK: dataArray[32],
      KG: dataArray[33],
      G1: dataArray[34],
      G2: dataArray[35],
      G3: dataArray[36],
      G4: dataArray[37],
      G5: dataArray[38],
      G6: dataArray[39],
      G7: dataArray[40],
      G8: dataArray[41],
      G9: dataArray[42],
      G10: dataArray[43],
      G11: dataArray[44],
      G12: dataArray[45],
      G13: dataArray[46],
      UNGRADED: dataArray[47],
      ADULT: dataArray[48],
      MALE: dataArray[49],
      FEMALE: dataArray[50],
      TEACHERS: dataArray[53],
      LATITUDE: dataArray[76],
      LONGITUDE: dataArray[77],
    };
    await dbaddCountyData(
      dataArray[27]!,
      "Education",
      dataArray[9]!,
      "NCES_PUBLIC",
      dataObject,
    );
  }
}

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
