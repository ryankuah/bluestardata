import { addCountyData, addStateData } from "@/utils/db/utils";
import { env } from "@/env";
import {
  type FredData,
  type Observations,
  type FredCategory,
  type Category,
  type FredSeries,
  type Series,
  type FredObservations,
} from "./types";
import { getCountyGeoId, getStatebyName } from "../utils";

export async function fetchCategories(id = 0) {
  const allCategories = (
    (await fetch(
      `https://api.stlouisfed.org/fred/category/children?category_id=${id}&api_key=${env.FRED_API_KEY}&file_type=json`,
    ).then((res) => res.json())) as unknown as FredCategory
  ).categories as unknown as Category[];
  return allCategories;
}

export async function fetchSeries(id = 0) {
  const allSeries = (
    (await fetch(
      `https://api.stlouisfed.org/fred/category/series?category_id=${id}&api_key=${env.FRED_API_KEY}&file_type=json`,
    ).then((res) => res.json())) as unknown as FredSeries
  ).seriess as unknown as Series[];
  return allSeries;
}

export async function fetchObservations(fredObj: FredData[]) {
  const out: Observations[] = [];
  for (const obj of fredObj) {
    const code = obj.seriesCode;
    const observations = await fetchObservation(code, obj.name);
    out.push(observations);
  }
  return out;
}

export async function fetchObservation(code: string, name: string) {
  const fredObservation = (await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${code}&file_type=json&api_key=${env.FRED_API_KEY}`,
  ).then((res) => res.json())) as unknown as FredObservations;

  const observations: Observations = {
    code: code,
    units: fredObservation.units,
    name: name ?? code,
    observations: fredObservation.observations.map((observation) => ({
      date: observation.date,
      value: observation.value,
    })),
  };
  return observations;
}

export async function addFredIds() {
  const fredIDs = await fetchCategories(27281);
  for (const id of fredIDs) {
    const state = await getStatebyName(id.name);
    await addStateData(state, "Reference Code", "FRED", "Fred ID", id.id);
    const stateFreds = await fetchCategories(id.id);
    const countyID = stateFreds.find(
      (selection) =>
        selection.name === "Counties" ||
        selection.name === "Parishes" ||
        selection.name === "Census Areas and Boroughs",
    )?.id;

    if (!countyID) continue;

    const counties = await fetchCategories(countyID);
    for (const county of counties) {
      const countyId = await getCountyGeoId(county.name, id.name);
      await addCountyData(
        countyId,
        "Reference Code",
        "FRED",
        "Fred ID",
        county.id,
      );
    }
  }
}

export async function getStateFredId(
  stateName: string,
): Promise<number | null> {
  const { getStateData } = await import("@/utils/db/utils");
  const stateFips = await getStatebyName(stateName);
  try {
    const fredId = await getStateData(
      stateFips.toString(),
      "Fred ID",
      "Reference Code",
    );
    return typeof fredId === "number" ? fredId : Number(fredId);
  } catch {
    return null;
  }
}

export async function getCountyFredId(geoId: string): Promise<number | null> {
  const { getCountyData } = await import("@/utils/db/utils");
  try {
    const fredId = await getCountyData(geoId, "Fred ID", "Reference Code");
    return typeof fredId === "number" ? fredId : Number(fredId);
  } catch {
    return null;
  }
}

export async function exportFredCountiesToCSV() {
  const csvData: string[] = ["County Name,FRED ID"];

  try {
    const fredIDs = await fetchCategories(27281);

    for (const stateCategory of fredIDs) {
      console.log(`Processing state: ${stateCategory.name}`);

      const stateFreds = await fetchCategories(stateCategory.id);
      const countyID = stateFreds.find(
        (selection) =>
          selection.name === "Counties" ||
          selection.name === "Parishes" ||
          selection.name === "Census Areas and Boroughs",
      )?.id;

      if (!countyID) {
        console.log(`No counties found for ${stateCategory.name}`);
        continue;
      }

      const counties = await fetchCategories(countyID);
      console.log(`Found ${counties.length} counties in ${stateCategory.name}`);

      for (const county of counties) {
        csvData.push(`"${county.name}",${county.id}`);
      }
    }

    const csvContent = csvData.join("\n");

    // Write to file (you can run this in Node.js environment)
    const fs = await import("fs").then((m) => m.default);
    fs.writeFileSync("fred_counties.csv", csvContent, "utf8");

    console.log(
      `Successfully exported ${csvData.length - 1} counties to fred_counties.csv`,
    );
    return csvContent;
  } catch (error) {
    console.error("Error exporting FRED counties:", error);
    throw error;
  }
}
