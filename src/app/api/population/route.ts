import { type NextRequest } from "next/server";
import { env } from "@/env";
import { db } from "@/server/db";
import { acsPopulationData } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

const ACS_API_URL = "https://api.census.gov/data/";
const CENSUS_API_KEY = env.CENSUS_API_KEY;
const CACHE_DURATION_DAYS = 365; // ACS data updates annually

if (!CENSUS_API_KEY) {
  throw new Error("Census API Key is not set in the environment variables.");
}

// Split variables into groups to stay under the 50-variable limit
const VARIABLES = {
  // Group 1: Basic population and male age groups (part 1)
  GROUP1: {
    TOTAL_POP: "B01001_001E",
    // Male by age
    MALE_UNDER_5: "B01001_003E",
    MALE_5_9: "B01001_004E",
    MALE_10_14: "B01001_005E",
    MALE_15_17: "B01001_006E",
    MALE_18_19: "B01001_007E",
    MALE_20: "B01001_008E",
    MALE_21: "B01001_009E",
    MALE_22_24: "B01001_010E",
    MALE_25_29: "B01001_011E",
    MALE_30_34: "B01001_012E",
    MALE_35_39: "B01001_013E",
    MALE_40_44: "B01001_014E",
  },
  // Group 2: Male age groups (part 2)
  GROUP2: {
    MALE_45_49: "B01001_015E",
    MALE_50_54: "B01001_016E",
    MALE_55_59: "B01001_017E",
    MALE_60_61: "B01001_018E",
    MALE_62_64: "B01001_019E",
    MALE_65_66: "B01001_020E",
    MALE_67_69: "B01001_021E",
    MALE_70_74: "B01001_022E",
    MALE_75_79: "B01001_023E",
    MALE_80_84: "B01001_024E",
    MALE_85_OVER: "B01001_025E",
  },
  // Group 3: Female age groups (part 1)
  GROUP3: {
    FEMALE_UNDER_5: "B01001_027E",
    FEMALE_5_9: "B01001_028E",
    FEMALE_10_14: "B01001_029E",
    FEMALE_15_17: "B01001_030E",
    FEMALE_18_19: "B01001_031E",
    FEMALE_20: "B01001_032E",
    FEMALE_21: "B01001_033E",
    FEMALE_22_24: "B01001_034E",
    FEMALE_25_29: "B01001_035E",
    FEMALE_30_34: "B01001_036E",
    FEMALE_35_39: "B01001_037E",
    FEMALE_40_44: "B01001_038E",
  },
  // Group 4: Female age groups (part 2)
  GROUP4: {
    FEMALE_45_49: "B01001_039E",
    FEMALE_50_54: "B01001_040E",
    FEMALE_55_59: "B01001_041E",
    FEMALE_60_61: "B01001_042E",
    FEMALE_62_64: "B01001_043E",
    FEMALE_65_66: "B01001_044E",
    FEMALE_67_69: "B01001_045E",
    FEMALE_70_74: "B01001_046E",
    FEMALE_75_79: "B01001_047E",
    FEMALE_80_84: "B01001_048E",
    FEMALE_85_OVER: "B01001_049E",
  },
  // Group 5: Race and Hispanic origin
  GROUP5: {
    WHITE_ALONE: "B02001_002E",
    BLACK_ALONE: "B02001_003E",
    AMERICAN_INDIAN_ALONE: "B02001_004E",
    ASIAN_ALONE: "B02001_005E",
    PACIFIC_ISLANDER_ALONE: "B02001_006E",
    OTHER_RACE_ALONE: "B02001_007E",
    TWO_OR_MORE_RACES: "B02001_008E",
    HISPANIC_OR_LATINO: "B03003_003E",
  },
  GROUP6: {
    TOTAL_VETERANS: "B21001_002E", // Total veterans
    VETERAN_EMPLOYMENT: "B21005_002E", // Civilian veterans 18 years and over in labor force
    VETERAN_DISABILITY: "B21100_002E", // Veterans with a disability
  },
  // EDUCATIONAL_ATTAINMENT
  GROUP7: {
    TOTAL_EDUCATION: "B15003_001E",
    LESS_THAN_HS: "B15003_002E",
    HS_GRADUATE: "B15003_017E",
    SOME_COLLEGE: "B15003_018E",
    ASSOCIATES: "B15003_021E",
    BACHELORS: "B15003_022E",
    MASTERS_OR_HIGHER: "B15003_023E",
  },
  // NATIVITY_CITIZENSHIP
  GROUP8: {
    FOREIGN_BORN: "B05002_013E",
    NATURALIZED_CITIZEN: "B05003_003E",
    NOT_CITIZEN: "B05003_004E",
  },

  GROUP9: {
    MEDIAN_HOUSEHOLD_INCOME: "B19013_001E",
    PER_CAPITA_INCOME: "B19301_001E",
    BELOW_POVERTY: "B17001_002E",
    EMPLOYED: "B23025_004E",
    UNEMPLOYED: "B23025_005E",
    NOT_IN_LABOR_FORCE: "B23025_007E",
  },
};

interface AcsApiUrlParams {
  year: string;
  stateFips: string;
  countyFips?: string;
  variables: string[];
}

function constructAcsApiUrl({
  year,
  stateFips,
  countyFips,
  variables,
}: AcsApiUrlParams): string {
  const variablesList = ["NAME", ...variables].join(",");
  let url = `${ACS_API_URL}${year}/acs/acs5?get=${variablesList}&key=${CENSUS_API_KEY}`;

  if (stateFips && countyFips) {
    url += `&for=county:${countyFips}&in=state:${stateFips}`;
  } else if (stateFips) {
    url += `&for=county:*&in=state:${stateFips}`;
  } else {
    url += `&for=county:*`;
  }

  return url;
}

type PostRequestBody = {
  stateFips: string;
  countyFips?: string;
  year: number;
};

async function fetchGroupData(params: AcsApiUrlParams): Promise<string[][]> {
  const url = constructAcsApiUrl(params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Census API returned ${response.status}: ${await response.text()}`,
    );
  }

  return response.json() as Promise<string[][]>;
}

type ProcessedAcsData = {
  name: string;
  totalPopulation: number;
  malePopulation: {
    under5: number;
    under18: number;
    age18to24: number;
    age25to44: number;
    age45to64: number;
    age65andOver: number;
    total: number;
  };
  femalePopulation: {
    under5: number;
    under18: number;
    age18to24: number;
    age25to44: number;
    age45to64: number;
    age65andOver: number;
    total: number;
  };
  raceAndHispanic: {
    whiteAlone: number;
    blackAlone: number;
    americanIndianAlone: number;
    asianAlone: number;
    pacificIslanderAlone: number;
    otherRaceAlone: number;
    twoOrMoreRaces: number;
    hispanicOrLatino: number;
  };
  veteranStatus: {
    totalVeterans: number;
    employedVeterans: number;
    veteransWithDisability: number;
  };
  nativityCitizenship: {
    foreignBorn: number;
    naturalizedCitizen: number;
    notCitizen: number;
  };
  education: {
    lessThanHS: number;
    hsGraduate: number;
    someCollege: number;
    associates: number;
    bachelors: number;
    mastersOrHigher: number;
  };
  incomeEmployment: {
    totalLaborForce: number;
    medianHouseholdIncome: number;
    perCapitaIncome: number;
    percentBelowPoverty: number;
    percentEmployed: number;
    percentUnemployed: number;
    laborForceParticipation: number;
  };
};

function processAcsData(dataGroups: string[][][]): ProcessedAcsData {
  // Combine all data groups into a single map for easier access
  const dataMap = new Map<string, string>();

  dataGroups.forEach((group) => {
    const headers = group[0];
    const values = group[1];
    if (headers && values) {
      headers.forEach((header, index) => {
        const value = values[index];
        if (value !== null && value !== undefined) {
          dataMap.set(header, value);
        }
      });
    }
  });

  const getValue = (variable: string): number => {
    const value = dataMap.get(variable);
    return value ? parseInt(value, 10) : 0;
  };

  // ✅ Male Age Group Calculations
  const maleUnder5 = getValue(VARIABLES.GROUP1.MALE_UNDER_5);
  const maleUnder18 =
    maleUnder5 +
    getValue(VARIABLES.GROUP1.MALE_5_9) +
    getValue(VARIABLES.GROUP1.MALE_10_14) +
    getValue(VARIABLES.GROUP1.MALE_15_17);

  const male18to24 =
    getValue(VARIABLES.GROUP1.MALE_18_19) +
    getValue(VARIABLES.GROUP1.MALE_20) +
    getValue(VARIABLES.GROUP1.MALE_21) +
    getValue(VARIABLES.GROUP1.MALE_22_24);

  const male25to44 =
    getValue(VARIABLES.GROUP1.MALE_25_29) +
    getValue(VARIABLES.GROUP1.MALE_30_34) +
    getValue(VARIABLES.GROUP1.MALE_35_39) +
    getValue(VARIABLES.GROUP1.MALE_40_44);

  const male45to64 =
    getValue(VARIABLES.GROUP2.MALE_45_49) +
    getValue(VARIABLES.GROUP2.MALE_50_54) +
    getValue(VARIABLES.GROUP2.MALE_55_59) +
    getValue(VARIABLES.GROUP2.MALE_60_61) +
    getValue(VARIABLES.GROUP2.MALE_62_64);

  const male65andOver =
    getValue(VARIABLES.GROUP2.MALE_65_66) +
    getValue(VARIABLES.GROUP2.MALE_67_69) +
    getValue(VARIABLES.GROUP2.MALE_70_74) +
    getValue(VARIABLES.GROUP2.MALE_75_79) +
    getValue(VARIABLES.GROUP2.MALE_80_84) +
    getValue(VARIABLES.GROUP2.MALE_85_OVER);

  const maleTotal =
    maleUnder18 + male18to24 + male25to44 + male45to64 + male65andOver;

  // ✅ Female Age Group Calculations
  const femaleUnder5 = getValue(VARIABLES.GROUP3.FEMALE_UNDER_5);
  const femaleUnder18 =
    femaleUnder5 +
    getValue(VARIABLES.GROUP3.FEMALE_5_9) +
    getValue(VARIABLES.GROUP3.FEMALE_10_14) +
    getValue(VARIABLES.GROUP3.FEMALE_15_17);

  const female18to24 =
    getValue(VARIABLES.GROUP3.FEMALE_18_19) +
    getValue(VARIABLES.GROUP3.FEMALE_20) +
    getValue(VARIABLES.GROUP3.FEMALE_21) +
    getValue(VARIABLES.GROUP3.FEMALE_22_24);

  const female25to44 =
    getValue(VARIABLES.GROUP3.FEMALE_25_29) +
    getValue(VARIABLES.GROUP3.FEMALE_30_34) +
    getValue(VARIABLES.GROUP3.FEMALE_35_39) +
    getValue(VARIABLES.GROUP3.FEMALE_40_44);

  const female45to64 =
    getValue(VARIABLES.GROUP4.FEMALE_45_49) +
    getValue(VARIABLES.GROUP4.FEMALE_50_54) +
    getValue(VARIABLES.GROUP4.FEMALE_55_59) +
    getValue(VARIABLES.GROUP4.FEMALE_60_61) +
    getValue(VARIABLES.GROUP4.FEMALE_62_64);

  const female65andOver =
    getValue(VARIABLES.GROUP4.FEMALE_65_66) +
    getValue(VARIABLES.GROUP4.FEMALE_67_69) +
    getValue(VARIABLES.GROUP4.FEMALE_70_74) +
    getValue(VARIABLES.GROUP4.FEMALE_75_79) +
    getValue(VARIABLES.GROUP4.FEMALE_80_84) +
    getValue(VARIABLES.GROUP4.FEMALE_85_OVER);

  const femaleTotal =
    femaleUnder18 +
    female18to24 +
    female25to44 +
    female45to64 +
    female65andOver;

  // ✅ Race and Hispanic Population
  const raceAndHispanic = {
    whiteAlone: getValue(VARIABLES.GROUP5.WHITE_ALONE),
    blackAlone: getValue(VARIABLES.GROUP5.BLACK_ALONE),
    americanIndianAlone: getValue(VARIABLES.GROUP5.AMERICAN_INDIAN_ALONE),
    asianAlone: getValue(VARIABLES.GROUP5.ASIAN_ALONE),
    pacificIslanderAlone: getValue(VARIABLES.GROUP5.PACIFIC_ISLANDER_ALONE),
    otherRaceAlone: getValue(VARIABLES.GROUP5.OTHER_RACE_ALONE),
    twoOrMoreRaces: getValue(VARIABLES.GROUP5.TWO_OR_MORE_RACES),
    hispanicOrLatino: getValue(VARIABLES.GROUP5.HISPANIC_OR_LATINO),
  };
  const veteranStatus = {
    totalVeterans: getValue(VARIABLES.GROUP6.TOTAL_VETERANS),
    employedVeterans: getValue(VARIABLES.GROUP6.VETERAN_EMPLOYMENT),
    veteransWithDisability: getValue(VARIABLES.GROUP6.VETERAN_DISABILITY),
  };
  const nativityCitizenship = {
    foreignBorn: getValue(VARIABLES.GROUP8.FOREIGN_BORN),
    naturalizedCitizen: getValue(VARIABLES.GROUP8.NATURALIZED_CITIZEN),
    notCitizen: getValue(VARIABLES.GROUP8.NOT_CITIZEN),
  };
  const education = {
    total_education: getValue(VARIABLES.GROUP7.TOTAL_EDUCATION),
    lessThanHS: getValue(VARIABLES.GROUP7.LESS_THAN_HS),
    hsGraduate: getValue(VARIABLES.GROUP7.HS_GRADUATE),
    someCollege: getValue(VARIABLES.GROUP7.SOME_COLLEGE),
    associates: getValue(VARIABLES.GROUP7.ASSOCIATES),
    bachelors: getValue(VARIABLES.GROUP7.BACHELORS),
    mastersOrHigher: getValue(VARIABLES.GROUP7.MASTERS_OR_HIGHER),
  };
  const totalPopulation = getValue(VARIABLES.GROUP1.TOTAL_POP);
  const employed = getValue(VARIABLES.GROUP9.EMPLOYED);
  const unemployed = getValue(VARIABLES.GROUP9.UNEMPLOYED);
  const totalLaborForce = employed + unemployed;

  const employmentRate =
    totalLaborForce > 0 ? (employed / totalLaborForce) * 100 : 0;
  const unemploymentRate =
    totalLaborForce > 0 ? (unemployed / totalLaborForce) * 100 : 0;
  const laborForceParticipation =
    totalPopulation > 0 ? (totalLaborForce / totalPopulation) * 100 : 0;

  const incomeEmployment = {
    totalLaborForce,
    medianHouseholdIncome: getValue(VARIABLES.GROUP9.MEDIAN_HOUSEHOLD_INCOME),
    perCapitaIncome: getValue(VARIABLES.GROUP9.PER_CAPITA_INCOME),
    percentBelowPoverty: getValue(VARIABLES.GROUP9.BELOW_POVERTY),
    percentEmployed: employmentRate, // ✅ Fixed incorrect employment rate calculation
    percentUnemployed: unemploymentRate, // ✅ Fixed incorrect unemployment rate calculation
    laborForceParticipation: laborForceParticipation, // ✅ Fixed labor force participation rate
  };

  return {
    name: dataMap.get("NAME") ?? "Unknown",
    totalPopulation: getValue(VARIABLES.GROUP1.TOTAL_POP),
    malePopulation: {
      under5: maleUnder5,
      under18: maleUnder18,
      age18to24: male18to24,
      age25to44: male25to44,
      age45to64: male45to64,
      age65andOver: male65andOver,
      total: maleTotal,
    },
    femalePopulation: {
      under5: femaleUnder5,
      under18: femaleUnder18,
      age18to24: female18to24,
      age25to44: female25to44,
      age45to64: female45to64,
      age65andOver: female65andOver,
      total: femaleTotal,
    },
    raceAndHispanic,
    veteranStatus,
    education,
    nativityCitizenship,
    incomeEmployment,
  };
}
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = (await req.json()) as PostRequestBody;
    const { stateFips, countyFips, year } = body;

    if (!stateFips) {
      return new Response(
        JSON.stringify({ error: "State FIPS code is required" }),
        { status: 400 },
      );
    }
    if (!year) {
      return new Response(JSON.stringify({ error: "Year is required" }), {
        status: 400,
      });
    }

    // CHECK DATABASE FIRST
    console.log(
      `🔍 Checking cache for ACS data: ${stateFips}-${countyFips || "*"}, year ${year}`,
    );

    const whereConditions = countyFips
      ? and(
          eq(acsPopulationData.stateFips, stateFips),
          eq(acsPopulationData.countyFips, countyFips),
          eq(acsPopulationData.year, year),
        )
      : and(
          eq(acsPopulationData.stateFips, stateFips),
          eq(acsPopulationData.year, year),
        );

    const cached = await db
      .select()
      .from(acsPopulationData)
      .where(whereConditions)
      .limit(1);

    if (cached.length > 0) {
      const record = cached[0]!;
      const fetchedAt = record.fetchedAt;
      const daysSinceFetch = fetchedAt
        ? (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      if (daysSinceFetch < CACHE_DURATION_DAYS) {
        console.log(
          `✅ Using cached ACS data (${Math.floor(daysSinceFetch)} days old)`,
        );
        return new Response(JSON.stringify(record.data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // NOT CACHED OR STALE - Fetch from Census API
    console.log(`❌ No fresh ACS data. Fetching from Census API...`);

    // Fetch each variable group separately
    const dataGroups = await Promise.all([
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP1),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP2),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP3),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP4),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP5),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP6),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP7),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP8),
      }),
      fetchGroupData({
        year: year.toString(),
        stateFips,
        countyFips,
        variables: Object.values(VARIABLES.GROUP9),
      }),
    ]);

    const processedData = processAcsData(dataGroups);

    // STORE IN DATABASE
    console.log(`💾 Storing ACS data in database...`);

    // Delete old data for this combination
    await db.delete(acsPopulationData).where(whereConditions);

    // Insert new data
    await db.insert(acsPopulationData).values({
      stateFips,
      countyFips: countyFips || null,
      year,
      data: processedData,
    });

    console.log(`✅ Stored ACS data in database`);

    return new Response(JSON.stringify(processedData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405,
  });
}
