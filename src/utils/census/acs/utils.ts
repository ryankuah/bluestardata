import { env } from "@/env";
import { addCountyData } from "@/utils/db/utils";
import type { DataSet } from "@/utils/db/types";

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
  "K200701_006E",
];

export async function fetchACS(stateFips: string, countyFips: string) {
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

  for (let year = 2014; year <= 2023; year++) {
    if (year === 2020) continue;
    const response = await fetch(
      `https://api.census.gov/data/${year}/acs/acsse?get=${ACS_VARIABLES.join(",")}&for=county:${countyFips}&in=state:${stateFips}&key=${env.CENSUS_API_KEY}`,
    );
    // console.log(
    //   `https://api.census.gov/data/${year}/acs/acsse?get=${ACS_VARIABLES.join(",")}&for=county:${countyFips}&in=state:${stateFips}&key=${env.CENSUS_API_KEY}`,
    // );

    if (!response.ok) {
      // console.log(response);
      throw new Error("Failed to fetch data from Census API");
    }
    const json = ((await response.json()) as unknown as string[][]).slice(1);
    if (!json[0]?.[32]) {
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
        "Demographics",
        "Population",
        "ACSSE",
        population,
      ),
      addCountyData(fullFips, "Age", "Median Age", "ACSSE", medianAge),
      addCountyData(fullFips, "Age", "Age by Age Bracket", "ACSSE", totalAge),
      addCountyData(fullFips, "Ethnicity", "Race", "ACSSE", race),
      addCountyData(
        fullFips,
        "Ethnicity",
        "Hispanic or Latino",
        "ACSSE",
        hispanicOrLatino,
      ),
      addCountyData(
        fullFips,
        "Nationality",
        "US Citizenship Status",
        "ACSSE",
        citizenship,
      ),
      addCountyData(fullFips, "Birth", "Birth Place", "ACSSE", birth),
      addCountyData(fullFips, "Mobility", "Yearly Mobility", "ACSSE", mobility),
    ]);
  } catch (error) {
    console.error("Error adding county data:", error);
    throw error;
  }
}
