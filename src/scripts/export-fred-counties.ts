import fs from "fs";

// Check for FRED_API_KEY
const FRED_API_KEY = process.env.FRED_API_KEY;
if (!FRED_API_KEY) {
  console.error("Error: FRED_API_KEY environment variable is required");
  console.error("Please set it with: export FRED_API_KEY=your_api_key");
  process.exit(1);
}

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
    `https://api.stlouisfed.org/fred/category/children?category_id=${id}&api_key=${FRED_API_KEY}&file_type=json`,
  );
  const data = (await response.json()) as FredCategory;
  return data.categories;
}

async function exportFredCountiesToCSV() {
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

    // Write to file
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

async function main() {
  console.log("Starting FRED counties export...");

  try {
    await exportFredCountiesToCSV();
    console.log("Export completed successfully!");
  } catch (error) {
    console.error("Export failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
