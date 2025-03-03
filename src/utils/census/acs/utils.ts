import { env } from "@/env";
import { addCountyData } from "@/utils/db/utils";
import type { DataSet } from "@/utils/db/types";
import { db } from "@/server/db";
import { counties } from "@/server/db/schema";

const ACS_VARIABLES = [
  "K200101_001E",
  "K200101_002E",
  "K200101_003E",
  "K200103_001E",
  "K200103_002E",
  "K200103_003E",
  "K200104_002E",
  "K200104_003E",
  "K200104_004E",
  "K200104_005E",
  "K200104_006E",
  "K200104_007E",
  "K200104_008E",
  "K200201_002E",
  "K200201_003E",
  "K200201_004E",
  "K200201_005E",
  "K200201_006E",
  "K200201_007E",
  "K200201_008E",
  "K200301_002E",
  "K200301_003E",
  "K200501_002E",
  "K200501_003E",
  "K200503_002E",
  "K200503_003E",
  "K200503_004E",
  "K200503_006E",
  "K200701_002E",
  "K200701_003E",
  "K200701_004E",
  "K200701_005E",
  "K200701_006E",
  "K200801_002E",
  "K200801_003E",
  "K200801_004E",
  "K200801_005E",
  "K200801_006E",
  "K200802_002E",
  "K200802_003E",
  "K200802_004E",
  "K200802_005E",
];

export async function fetchACS(stateFips: string, countyFips: string) {
  console.log("Fetching ACS for", stateFips, countyFips);

  if (!stateFips || !countyFips) {
    throw new Error("Missing required parameters: stateFips or countyFips");
  }
  const population: DataSet[] = [];
  const medianAge: DataSet[] = [];
  const totalAge: DataSet[] = [];
  const race: DataSet[] = [];
  const hispanicOrLatino: DataSet[] = [];
  const citizenship: DataSet[] = [];
  const birth: DataSet[] = [];
  const mobility: DataSet[] = [];
  const transportation: DataSet[] = [];
  const travelTime: DataSet[] = [];

  for (let year = 2014; year <= 2023; year++) {
    if (year === 2020) continue;
    const response = await fetch(
      `https://api.census.gov/data/${year}/acs/acsse?get=${ACS_VARIABLES.join(",")}&for=county:${countyFips}&in=state:${stateFips}&key=${env.CENSUS_API_KEY}`,
    );
    // console.log(
    //   `https://api.census.gov/data/${year}/acs/acsse?get=${ACS_VARIABLES.join(",")}&for=county:${countyFips}&in=state:${stateFips}&key=${env.CENSUS_API_KEY}`,
    // );

    if (response.status === 204) {
      console.log("No data for", year, countyFips, stateFips);
      continue;
    }
    const json = ((await response.json()) as unknown as string[][]).slice(1);
    if (!json[0]?.[41]) {
      throw new Error("Fetch ACS Error");
    }
    population.push({
      name: year.toString(),
      data: {
        total: Number(json[0][0]),
        male: Number(json[0][1]),
        female: Number(json[0][2]),
      },
      units: "",
    });
    medianAge.push({
      name: year.toString(),
      data: {
        combined: Number(json[0][3]),
        male: Number(json[0][4]),
        female: Number(json[0][5]),
      },
      units: "",
    });
    totalAge.push({
      name: year.toString(),
      data: {
        under_18: Number(json[0][6]),
        _18_to_24: Number(json[0][7]),
        _25_to_34: Number(json[0][8]),
        _35_to_44: Number(json[0][9]),
        _45_to_54: Number(json[0][10]),
        _55_to_64: Number(json[0][11]),
        over_65: Number(json[0][12]),
      },
      units: "",
    });
    race.push({
      name: year.toString(),
      data: {
        white: Number(json[0][13]),
        blackOrAfricanAmerican: Number(json[0][14]),
        americanIndianOrAlaskaNative: Number(json[0][15]),
        asian: Number(json[0][16]),
        nativeHawaiianOrOtherPacificIslander: Number(json[0][17]),
        twoOrMoreRaces: Number(json[0][19]),
        other: Number(json[0][18]),
      },
      units: "",
    });
    hispanicOrLatino.push({
      name: year.toString(),
      data: {
        notHispanicOrLatino: Number(json[0][20]),
        hispanicOrLatino: Number(json[0][21]),
      },
      units: "",
    });
    citizenship.push({
      name: year.toString(),
      data: {
        citizen: Number(json[0][22]),
        nonCitizen: Number(json[0][23]),
      },
      units: "",
    });
    birth.push({
      name: year.toString(),
      data: {
        US: Number(json[0][24]),
        state: Number(json[0][25]),
        differentState: Number(json[0][26]),
        foreignCountry: Number(json[0][27]),
      },
      units: "",
    });
    mobility.push({
      name: year.toString(),
      data: {
        haventMoved: Number(json[0][28]),
        sameCounty: Number(json[0][29]),
        sameState: Number(json[0][30]),
        differentState: Number(json[0][31]),
        abroad: Number(json[0][32]),
      },
      units: "",
    });
    transportation.push({
      name: year.toString(),
      data: {
        droveAlone: Number(json[0][33]),
        carpooled: Number(json[0][34]),
        publicTransportation: Number(json[0][35]),
        workFromHome: Number(json[0][37]),
        other: Number(json[0][36]),
      },
      units: "",
    });
    travelTime.push({
      name: year.toString(),
      data: {
        under_10: Number(json[0][38]),
        _10_to_29: Number(json[0][39]),
        _30_to_59: Number(json[0][40]),
        over_60: Number(json[0][41]),
      },
      units: "minutes",
    });
  }
  const stateCode = String(stateFips).padStart(2, "0");
  const countyCode = String(countyFips).padStart(3, "0");

  if (stateCode.length !== 2 || countyCode.length !== 3) {
    throw new Error(
      `Invalid FIPS codes: state=${stateFips}, county=${countyFips}`,
    );
  }
  const fullFips = stateCode + countyCode;

  try {
    await Promise.all([
      addCountyData(
        fullFips,
        "demographics",
        "population",
        "acsse",
        population,
      ),
      addCountyData(fullFips, "age", "medianAge", "acsse", medianAge),
      addCountyData(fullFips, "age", "totalAge", "acsse", totalAge),
      addCountyData(fullFips, "ethnicity", "race", "acsse", race),
      addCountyData(
        fullFips,
        "ethnicity",
        "hispanic",
        "acsse",
        hispanicOrLatino,
      ),
      addCountyData(
        fullFips,
        "nationality",
        "citizenship",
        "acsse",
        citizenship,
      ),
      addCountyData(fullFips, "birth", "birthPlace", "acsse", birth),
      addCountyData(fullFips, "mobility", "yearlyMobility", "acsse", mobility),
      addCountyData(
        fullFips,
        "work",
        "transportation",
        "acsse",
        transportation,
      ),
      addCountyData(fullFips, "work", "travelTime", "acsse", travelTime),
    ]);
    console.log("Done adding ACS for", fullFips);
  } catch (error) {
    console.error("Error adding county data:", error);
    throw error;
  }
}

export async function addAllACSData() {
  const allFips = await db.query.counties.findMany({
    columns: {
      geoId: true,
    },
  });
  await Promise.all(
    allFips
      .filter((item) => !item.geoId.startsWith("72"))
      .map((item) =>
        fetchACS(item.geoId.substring(0, 2), item.geoId.substring(2, 6)),
      ),
  );
}
