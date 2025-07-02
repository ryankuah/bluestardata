"use server";
import { db } from "@/server/db";
import { states, counties } from "@/server/db/schema";
import { type FeatureCollection as GeoJSON } from "geojson";
import countyFile from "./counties.json";
import stateFile from "./states.json";
import { addCountyData as dbaddCountyData } from "@/utils/db/utils";
//import { privateSchools } from "./privatences"
import fs from "fs";

export async function addNCESPublicData() {
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

export async function addNCESPrivateData() {
  const csvContent = fs
    .readFileSync("./public/privatences.csv", "utf-8")
    .split("\n")
    .slice(1);

  for (const school of csvContent) {
    const dataArray = school.split(",");
    const dataObject = {
      PPIN: dataArray[3],
      NAME: dataArray[4],
      ADDRESS: dataArray[5],
      CITY: dataArray[6],
      STABR: dataArray[7],
      ZIP: dataArray[8],
      COUNTY: dataArray[11],
      LATITUDE: dataArray[13],
      LONGITUDE: dataArray[14],
    };
    await dbaddCountyData(
      dataArray[10]!,
      "Education",
      dataArray[4]!,
      "NCES_PRIVATE",
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

export async function exportFredCountiesCSV() {
  const { env } = await import("@/env");
  const fs = await import("fs");
  const path = await import("path");

  interface Category {
    id: number;
    name: string;
    parent_id: number;
  }

  interface FredCategory {
    categories: Category[];
  }

  async function fetchCategories(id = 0) {
    const response = await fetch(
      `https://api.stlouisfed.org/fred/category/children?category_id=${id}&api_key=${env.FRED_API_KEY}&file_type=json`,
    );
    const data = (await response.json()) as FredCategory;
    return data.categories;
  }

  const csvData: string[] = ["County Name,FRED ID"];

  try {
    console.log("Fetching state categories from FRED...");
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

    // Write to public directory so it can be downloaded
    const publicPath = path.join(process.cwd(), "public", "fred_counties.csv");
    fs.writeFileSync(publicPath, csvContent, "utf8");

    console.log(
      `Successfully exported ${csvData.length - 1} counties to fred_counties.csv`,
    );
    return `Successfully exported ${csvData.length - 1} counties to fred_counties.csv. File available at /fred_counties.csv`;
  } catch (error) {
    console.error("Error exporting FRED counties:", error);
    throw error;
  }
}

export async function importFredCountyIds() {
  const fs = await import("fs");
  const path = await import("path");

  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), "public", "fred_counties.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").slice(1); // Skip header

    // Get all counties with their state info
    const counties = await db.query.counties.findMany({
      with: {
        state: true,
      },
    });

    console.log(`Found ${counties.length} counties in database`);
    console.log(`Found ${lines.length} FRED counties in CSV`);

    // Show sample data for debugging
    if (counties.length > 0) {
      console.log(
        `Sample DB counties:`,
        counties
          .slice(0, 3)
          .map((c) => `"${c.name}" (${c.state.abbreviation})`),
      );
    }
    if (lines.length > 1) {
      const sampleLine = lines[0];
      if (sampleLine) {
        const csvRegex = /^"([^"]+)",(\d+)$/;
        const csvMatch = csvRegex.exec(sampleLine);
        if (csvMatch) {
          const fullCountyName = csvMatch[1]!.trim();
          const parts = fullCountyName.split(", ");
          if (parts.length === 2) {
            const cleanName = parts[0]
              ?.replace(
                /\s+(County|Parish|Census Area|Borough|Municipio|City and Borough|Municipality|City)$/i,
                "",
              )
              .trim();
            console.log(
              `Sample FRED: "${parts[0]}" -> cleaned: "${cleanName}" (${parts[1]})`,
            );
          }
        }
      }
    }

    let matchedCount = 0;
    const unmatchedFred: string[] = [];
    const unmatchedDb: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV line properly - handle quoted strings with commas
      const csvMatch = /^"([^"]+)",(\d+)$/.exec(line);
      if (!csvMatch) {
        console.log(`Skipping malformed CSV line: ${line}`);
        continue;
      }

      const fullCountyName = csvMatch[1]!.trim();
      const fredId = parseInt(csvMatch[2]!);

      // Extract county name and state abbreviation
      const parts = fullCountyName.split(", ");
      if (parts.length !== 2) {
        console.log(`Skipping malformed FRED county: ${fullCountyName}`);
        continue;
      }

      const fredCountyName = parts[0];
      const fredStateAbbr = parts[1];

      if (!fredCountyName || !fredStateAbbr) {
        console.log(`Skipping invalid county parts: ${fullCountyName}`);
        continue;
      }

      // Clean the FRED county name by removing common suffixes
      const cleanFredName = fredCountyName
        .replace(
          /\s+(County|Parish|Census Area|Borough|Municipio|City and Borough|Municipality|City)$/i,
          "",
        )
        .trim();

      // Find matching county in database
      const matchedCounty = counties.find((county) => {
        const nameMatch =
          county.name.toLowerCase() === cleanFredName.toLowerCase();
        const stateMatch =
          county.state.abbreviation?.toLowerCase() ===
          fredStateAbbr.toLowerCase();
        return nameMatch && stateMatch;
      });

      // Debug logging for unmatched counties
      if (!matchedCounty) {
        console.log(
          `🔍 Debug - FRED: "${cleanFredName}" (${fredStateAbbr}), looking for match in database...`,
        );

        // Find counties with similar names in the same state
        const similarCounties = counties.filter(
          (county) =>
            county.state.abbreviation?.toLowerCase() ===
            fredStateAbbr.toLowerCase(),
        );

        if (similarCounties.length > 0) {
          console.log(
            `   Available counties in ${fredStateAbbr}:`,
            similarCounties
              .slice(0, 5)
              .map((c) => `"${c.name}"`)
              .join(", ") + (similarCounties.length > 5 ? "..." : ""),
          );
        } else {
          console.log(`   No counties found for state: ${fredStateAbbr}`);
        }
      }

      if (matchedCounty) {
        // Add FRED ID to county_data
        await dbaddCountyData(
          matchedCounty.geoId,
          "Reference Code",
          "Fred ID",
          "FRED",
          fredId,
        );

        matchedCount++;
        console.log(
          `✓ Matched: "${cleanFredName}" (${fredStateAbbr}) -> ${matchedCounty.geoId} (FRED ID: ${fredId})`,
        );
      } else {
        unmatchedFred.push(
          `${cleanFredName}, ${fredStateAbbr} (FRED ID: ${fredId})`,
        );
        console.log(
          `✗ No match for FRED county: "${cleanFredName}", ${fredStateAbbr}`,
        );
      }
    }

    // Check for counties in DB that don't have FRED matches
    for (const county of counties) {
      const fredEntry = lines.find((line) => {
        if (!line.trim()) return false;

        // Parse CSV line properly - handle quoted strings with commas
        const csvRegex = /^"([^"]+)",(\d+)$/;
        const csvMatch = csvRegex.exec(line);
        if (!csvMatch) return false;

        const fullCountyName = csvMatch[1]!.trim();
        const parts = fullCountyName.split(", ");
        if (parts.length !== 2) return false;
        const fredCountyName = parts[0];
        const fredStateAbbr = parts[1];

        if (!fredCountyName || !fredStateAbbr) return false;

        // Clean the FRED county name using the same logic
        const cleanFredName = fredCountyName
          .replace(
            /\s+(County|Parish|Census Area|Borough|Municipio|City and Borough|Municipality|City)$/i,
            "",
          )
          .trim();

        return (
          county.name.toLowerCase() === cleanFredName.toLowerCase() &&
          county.state.abbreviation?.toLowerCase() ===
            fredStateAbbr.toLowerCase()
        );
      });

      if (!fredEntry) {
        unmatchedDb.push(
          `${county.name}, ${county.state.abbreviation} (GeoID: ${county.geoId})`,
        );
      }
    }

    console.log("\n=== IMPORT SUMMARY ===");
    console.log(
      `✓ Successfully matched and imported: ${matchedCount} counties`,
    );
    console.log(`✗ Unmatched FRED counties: ${unmatchedFred.length}`);
    console.log(`✗ Unmatched DB counties: ${unmatchedDb.length}`);

    if (unmatchedFred.length > 0) {
      console.log("\nUnmatched FRED counties:");
      unmatchedFred
        .slice(0, 10)
        .forEach((county) => console.log(`  - ${county}`));
      if (unmatchedFred.length > 10)
        console.log(`  ... and ${unmatchedFred.length - 10} more`);
    }

    if (unmatchedDb.length > 0) {
      console.log("\nUnmatched DB counties:");
      unmatchedDb
        .slice(0, 10)
        .forEach((county) => console.log(`  - ${county}`));
      if (unmatchedDb.length > 10)
        console.log(`  ... and ${unmatchedDb.length - 10} more`);
    }

    return `Successfully imported FRED IDs for ${matchedCount} counties. ${unmatchedFred.length} FRED counties and ${unmatchedDb.length} DB counties remain unmatched.`;
  } catch (error) {
    console.error("Error importing FRED county IDs:", error);
    throw error;
  }
}

export async function exportFredStatesToCSV() {
  const { env } = await import("@/env");
  const fs = await import("fs");
  const path = await import("path");

  interface Category {
    id: number;
    name: string;
    parent_id: number;
  }

  interface FredCategory {
    categories: Category[];
  }

  async function fetchCategories(id = 0) {
    const response = await fetch(
      `https://api.stlouisfed.org/fred/category/children?category_id=${id}&api_key=${env.FRED_API_KEY}&file_type=json`,
    );
    const data = (await response.json()) as FredCategory;
    return data.categories;
  }

  const csvData: string[] = ["State Name,FRED ID"];

  try {
    console.log("Fetching state categories from FRED...");
    const fredStates = await fetchCategories(27281); // Regional data category

    for (const stateCategory of fredStates) {
      console.log(
        `Found state: ${stateCategory.name} (ID: ${stateCategory.id})`,
      );
      csvData.push(`"${stateCategory.name}",${stateCategory.id}`);
    }

    const csvContent = csvData.join("\n");

    // Write to public directory so it can be downloaded
    const publicPath = path.join(process.cwd(), "public", "fred_states.csv");
    fs.writeFileSync(publicPath, csvContent, "utf8");

    console.log(
      `Successfully exported ${csvData.length - 1} states to fred_states.csv`,
    );
    return `Successfully exported ${csvData.length - 1} states to fred_states.csv. File available at /fred_states.csv`;
  } catch (error) {
    console.error("Error exporting FRED states:", error);
    throw error;
  }
}

export async function importFredStateIds() {
  const fs = await import("fs");
  const path = await import("path");

  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), "public", "fred_states.csv");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n").slice(1); // Skip header

    // Get all states with their info
    const states = await db.query.states.findMany();

    console.log(`Found ${states.length} states in database`);
    console.log(`Found ${lines.length} FRED states in CSV`);

    // Show sample data for debugging
    if (states.length > 0) {
      console.log(
        `Sample DB states:`,
        states.slice(0, 3).map((s) => `"${s.name}" (${s.abbreviation})`),
      );
    }
    if (lines.length > 1) {
      const sampleLine = lines[0];
      if (sampleLine) {
        const csvRegex = /^"([^"]+)",(\d+)$/;
        const csvMatch = csvRegex.exec(sampleLine);
        if (csvMatch) {
          console.log(`Sample FRED: "${csvMatch[1]}" (ID: ${csvMatch[2]})`);
        }
      }
    }

    let matchedCount = 0;
    const unmatchedFred: string[] = [];
    const unmatchedDb: string[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV line properly - handle quoted strings
      const csvRegex = /^"([^"]+)",(\d+)$/;
      const csvMatch = csvRegex.exec(line);
      if (!csvMatch) {
        console.log(`Skipping malformed CSV line: ${line}`);
        continue;
      }

      const fredStateName = csvMatch[1]!.trim();
      const fredId = parseInt(csvMatch[2]!);

      console.log(
        `🔍 Processing FRED state: "${fredStateName}" (ID: ${fredId})`,
      );

      // Find matching state in database
      const matchedState = states.find((state) => {
        const match = state.name.toLowerCase() === fredStateName.toLowerCase();
        if (match) {
          console.log(
            `  ✓ Found match: "${fredStateName}" -> "${state.name}" (FIPS: ${state.fipsCode})`,
          );
        }
        return match;
      });

      // Debug logging for unmatched states
      if (!matchedState) {
        console.log(
          `🔍 Debug - FRED: "${fredStateName}", looking for match in database...`,
        );
        console.log(
          `   Available states:`,
          states
            .slice(0, 5)
            .map((s) => `"${s.name}"`)
            .join(", ") + (states.length > 5 ? "..." : ""),
        );
      }

      if (matchedState) {
        try {
          // Add FRED ID to state_data
          console.log(
            `🔄 Attempting to add state data for "${fredStateName}" (FIPS: ${matchedState.fipsCode}, FRED ID: ${fredId})`,
          );

          const { addStateData, getStateData } = await import(
            "@/utils/db/utils"
          );
          await addStateData(
            matchedState.fipsCode,
            "Reference Code",
            "Fred ID",
            "FRED",
            fredId,
          );

          // Verify the data was actually added
          try {
            const verifyData = await getStateData(
              matchedState.fipsCode.toString(),
              "Fred ID",
              "Reference Code",
            );
            console.log(
              `✅ Successfully added and verified: "${fredStateName}" -> FIPS ${matchedState.fipsCode} (FRED ID: ${fredId}, Stored: ${JSON.stringify(verifyData)})`,
            );
            matchedCount++;
          } catch (verifyError) {
            console.error(
              `❌ Data was not stored properly for "${fredStateName}":`,
              verifyError,
            );
          }
        } catch (error) {
          console.error(
            `❌ Error adding state data for "${fredStateName}":`,
            error,
          );
          console.error(
            `   State FIPS: ${matchedState.fipsCode}, FRED ID: ${fredId}`,
          );
        }
      } else {
        unmatchedFred.push(`${fredStateName} (FRED ID: ${fredId})`);
        console.log(`✗ No match for FRED state: "${fredStateName}"`);
      }
    }

    // Check for states in DB that don't have FRED matches
    for (const state of states) {
      const fredEntry = lines.find((line) => {
        if (!line.trim()) return false;

        const csvRegex = /^"([^"]+)",(\d+)$/;
        const csvMatch = csvRegex.exec(line);
        if (!csvMatch) return false;

        const fredStateName = csvMatch[1]!.trim();
        return state.name.toLowerCase() === fredStateName.toLowerCase();
      });

      if (!fredEntry) {
        unmatchedDb.push(`${state.name} (FIPS: ${state.fipsCode})`);
      }
    }

    console.log("\n=== STATE IMPORT SUMMARY ===");
    console.log(`✓ Successfully matched and imported: ${matchedCount} states`);
    console.log(`✗ Unmatched FRED states: ${unmatchedFred.length}`);
    console.log(`✗ Unmatched DB states: ${unmatchedDb.length}`);

    if (unmatchedFred.length > 0) {
      console.log("\nUnmatched FRED states:");
      unmatchedFred
        .slice(0, 10)
        .forEach((state) => console.log(`  - ${state}`));
      if (unmatchedFred.length > 10)
        console.log(`  ... and ${unmatchedFred.length - 10} more`);
    }

    if (unmatchedDb.length > 0) {
      console.log("\nUnmatched DB states:");
      unmatchedDb.slice(0, 10).forEach((state) => console.log(`  - ${state}`));
      if (unmatchedDb.length > 10)
        console.log(`  ... and ${unmatchedDb.length - 10} more`);
    }

    return `Successfully imported FRED IDs for ${matchedCount} states. ${unmatchedFred.length} FRED states and ${unmatchedDb.length} DB states remain unmatched.`;
  } catch (error) {
    console.error("Error importing FRED state IDs:", error);
    throw error;
  }
}
