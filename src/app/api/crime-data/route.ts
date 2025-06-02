// src/app/api/crime-data/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_KEY =
  process.env.FBI_API_KEY || "iiHnOKfno2Mgkt5AynpvPpUQTEyxE77jo1RU8PIv";
const API_BASE_URL = "https://api.usa.gov/crime/fbi/cde";

// For summarized crime types (annual data)
interface SummarizedYearData {
  year: number;
  population?: number;
  [key: string]: number | undefined;
}

// Interface for offense-specific yearly data
interface OffenseYearlyData {
  year: number;
  total: number;
  male?: number;
  female?: number;
  byRace?: { [key: string]: number };
  byAge?: { [key: string]: number };
}

// This is the JSON structure for Arrest Demographics
interface ArrestDemographicsData {
  "Arrestee Sex": { [key: string]: number };
  "Offense Name": { [key: string]: number };
  "Arrestee Race": { [key: string]: number };
  "Offense Category": { [key: string]: number };
  "Offense Breakdown": { [key: string]: number };
  "Male Arrests By Age": { [key: string]: number };
  "Female Arrests By Age": { [key: string]: number };
  cde_properties?: any;
}

// Unified API response structure for the frontend
interface AppCrimeApiResponse {
  dataType:
    | "summarized_offense_annual"
    | "arrest_demographics_total"
    | "offense_yearly_trend";
  summaries?: SummarizedYearData[];
  crimeTypeKey?: string;
  arrestDemographics?: ArrestDemographicsData;
  offenseYearlyData?: OffenseYearlyData[];
  offenseName?: string;
  message?: string;
}

// FBI offense codes mapping
const OFFENSE_CODES: { [key: string]: string } = {
  all: "All Offenses",
  "11": "Murder and Nonnegligent Homicide",
  "23": "Rape",
  "30": "Robbery",
  "60": "Burglary",
  "210": "Stolen Property",
  "220": "Vandalism",
  "250": "Offenses Against Family and Children",
  "260": "Driving Under the Influence",
  "280": "Drunkenness",
  "520": "Weapons Violations",
  "180": "Drug Abuse Violations",
  "190": "Gambling",
  "140": "Aggravated Assault",
  "150": "Simple Assault",
  "200": "Arson",
  "240": "Motor Vehicle Theft",
  "270": "Embezzlement",
  "290": "All Other Offenses",
};

// Fetches data for specific summarized offenses (monthly, then aggregated)
async function fetchSingleSummarizedOffenseData(
  stateAbbr: string,
  fromDate: string,
  toDate: string,
  crimeTypeSlug: string,
): Promise<any> {
  const url = `${API_BASE_URL}/summarized/state/${stateAbbr}/${crimeTypeSlug}`;
  const params = new URLSearchParams({
    from: fromDate,
    to: toDate,
    API_KEY: API_KEY || "",
  });
  console.log(`Fetching FBI Summarized Offense: ${url}?${params.toString()}`);
  const response = await fetch(`${url}?${params.toString()}`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to fetch summarized data for slug ${crimeTypeSlug}: ${response.status} - ${errorText}`,
    );
    throw new Error(
      `FBI API Error for ${crimeTypeSlug}: ${response.status} - ${errorText}`,
    );
  }
  try {
    return await response.json();
  } catch (e) {
    console.error(
      `Failed to parse JSON for summarized slug ${crimeTypeSlug}:`,
      e,
    );
    throw new Error(`Failed to parse JSON response for ${crimeTypeSlug}`);
  }
}

// Fetches arrest demographics totals for a date range
async function fetchArrestDemographicsData(
  stateAbbr: string,
  fromDate: string,
  toDate: string,
): Promise<any> {
  const url = `${API_BASE_URL}/arrest/state/${stateAbbr}/all`;
  const params = new URLSearchParams({
    type: "totals",
    from: fromDate,
    to: toDate,
    API_KEY: API_KEY || "",
  });
  console.log(`Fetching FBI Arrest Demographics: ${url}?${params.toString()}`);
  const response = await fetch(`${url}?${params.toString()}`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to fetch arrest demographics: ${response.status} - ${errorText}`,
    );
    throw new Error(
      `FBI API Error for Arrest Demographics: ${response.status} - ${errorText}`,
    );
  }
  try {
    const data = await response.json();
    console.log(
      "Raw arrest demographics data structure:",
      Object.keys(data || {}),
    );
    return data;
  } catch (e) {
    console.error(`Failed to parse JSON for arrest demographics:`, e);
    throw new Error(`Failed to parse JSON response for arrest demographics`);
  }
}

// Fetches offense-specific data for a single year
async function fetchOffenseDataForYear(
  stateAbbr: string,
  year: number,
  offenseCode: string,
): Promise<OffenseYearlyData> {
  const url = `${API_BASE_URL}/arrest/state/${stateAbbr}/${offenseCode}`;
  const fromDate = `01-${year}`;
  const toDate = `12-${year}`;

  const params = new URLSearchParams({
    type: "totals",
    from: fromDate,
    to: toDate,
    API_KEY: API_KEY || "",
  });

  console.log(`Fetching offense data for ${year}: ${url}?${params.toString()}`);
  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `Failed to fetch offense data for ${year}: ${response.status} - ${errorText}`,
    );
    throw new Error(
      `FBI API Error for offense ${offenseCode} in ${year}: ${response.status}`,
    );
  }

  try {
    const data = await response.json();

    // Parse the response to extract totals
    const totalArrests =
      (data["Arrestee Sex"]?.Male || 0) + (data["Arrestee Sex"]?.Female || 0);

    return {
      year,
      total: totalArrests,
      male: data["Arrestee Sex"]?.Male || 0,
      female: data["Arrestee Sex"]?.Female || 0,
      byRace: data["Arrestee Race"] || {},
      byAge: {
        ...data["Male Arrests By Age"],
        ...data["Female Arrests By Age"],
      },
    };
  } catch (e) {
    console.error(`Failed to parse offense data for ${year}:`, e);
    return {
      year,
      total: 0,
      male: 0,
      female: 0,
    };
  }
}

// Fetches offense data for multiple years
async function fetchOffenseYearlyTrend(
  stateAbbr: string,
  years: number[],
  offenseCode: string,
): Promise<OffenseYearlyData[]> {
  const yearlyDataPromises = years.map((year) =>
    fetchOffenseDataForYear(stateAbbr, year, offenseCode),
  );

  try {
    const yearlyData = await Promise.all(yearlyDataPromises);
    return yearlyData.sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error("Error fetching yearly offense trend:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stateFips, years = [], crimeTypeSlug, targetKey, category } = body;

    if (!stateFips || !years.length || !crimeTypeSlug) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: stateFips, years, and crimeTypeSlug are required.",
        },
        { status: 400 },
      );
    }

    const stateAbbr = getStateAbbrFromFips(stateFips);
    if (!stateAbbr) {
      return NextResponse.json(
        { error: `Invalid state FIPS code: ${stateFips}` },
        { status: 400 },
      );
    }

    const startYear = Math.min(...years);
    const endYear = Math.max(...years);
    const fromDate = `01-${startYear}`;
    const toDate = `12-${endYear}`;

    console.log(
      `API Route: Processing request for ${stateAbbr}, type slug: ${crimeTypeSlug}, category: ${category}, range: ${fromDate} to ${toDate}`,
    );

    // Handle offense-specific yearly trends
    if (crimeTypeSlug.startsWith("OFFENSE_")) {
      const offenseCode = crimeTypeSlug.replace("OFFENSE_", "");
      const offenseName = OFFENSE_CODES[offenseCode] || "Unknown Offense";

      console.log(
        `Fetching yearly trend for offense: ${offenseCode} (${offenseName})`,
      );

      const offenseYearlyData = await fetchOffenseYearlyTrend(
        stateAbbr,
        years,
        offenseCode,
      );

      return NextResponse.json({
        dataType: "offense_yearly_trend",
        offenseYearlyData,
        offenseName,
      });
    }

    // Handle total arrest demographics
    if (crimeTypeSlug === "ARREST_DEMOGRAPHICS_OVERALL") {
      const arrestData = await fetchArrestDemographicsData(
        stateAbbr,
        fromDate,
        toDate,
      );

      // Handle different possible response structures
      let finalArrestData = arrestData;
      if (arrestData.data) {
        finalArrestData = arrestData.data;
      }
      if (Array.isArray(finalArrestData) && finalArrestData.length > 0) {
        finalArrestData = finalArrestData[0];
      }

      return NextResponse.json({
        dataType: "arrest_demographics_total",
        arrestDemographics: finalArrestData,
      });
    }

    // Handle summarized offense data (existing logic)
    if (!targetKey) {
      return NextResponse.json(
        { error: "Missing targetKey for summarized offense request." },
        { status: 400 },
      );
    }

    const rawSummarizedData = await fetchSingleSummarizedOffenseData(
      stateAbbr,
      fromDate,
      toDate,
      crimeTypeSlug,
    );
    const transformedAnnualData = transformMonthlyDataToAnnual(
      rawSummarizedData,
      targetKey,
      years,
      stateAbbr,
    );
    return NextResponse.json({
      dataType: "summarized_offense_annual",
      summaries: transformedAnnualData.summaries,
      crimeTypeKey: transformedAnnualData.crimeTypeKey,
    });
  } catch (error) {
    console.error("API Route General Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process crime data request.",
        message:
          error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    );
  }
}

// transformMonthlyDataToAnnual function remains as previously defined
// It processes responses from fetchSingleSummarizedOffenseData
function transformMonthlyDataToAnnual(
  rawCrimeData: any,
  dataKey: string,
  requestedYears: number[],
  stateAbbr: string,
): { summaries: SummarizedYearData[]; crimeTypeKey: string } {
  const summariesByYear: { [year: number]: SummarizedYearData } = {};
  requestedYears.forEach((year) => {
    summariesByYear[year] = { year };
  });

  const monthlyCrimeCounts = rawCrimeData?.offenses?.actuals?.[stateAbbr];
  if (monthlyCrimeCounts) {
    for (const monthYearKey in monthlyCrimeCounts) {
      const count = monthlyCrimeCounts[monthYearKey];
      if (count === null || count === undefined) continue;
      const parsedCount = parseInt(count, 10);
      const parts = monthYearKey.split("-");
      if (parts.length !== 2 || !parts[1]) continue;
      const year = parseInt(parts[1], 10);
      if (
        !isNaN(parsedCount) &&
        summariesByYear[year] &&
        requestedYears.includes(year)
      ) {
        summariesByYear[year][dataKey] =
          ((summariesByYear[year][dataKey] || 0) as number) + parsedCount;
      }
    }
  }
  const monthlyPopulationCounts =
    rawCrimeData?.populations?.population?.[stateAbbr];
  if (monthlyPopulationCounts) {
    for (const monthYearKey in monthlyPopulationCounts) {
      const [monthStr, yearStr] = monthYearKey.split("-");
      if (monthStr === "01" && yearStr) {
        const year = parseInt(yearStr, 10);
        const population = parseInt(monthlyPopulationCounts[monthYearKey], 10);
        if (
          !isNaN(population) &&
          summariesByYear[year] &&
          summariesByYear[year].population === undefined
        ) {
          summariesByYear[year].population = population;
        }
      }
    }
  }
  const summaries = Object.values(summariesByYear)
    .filter((summary) => requestedYears.includes(summary.year))
    .filter(
      (summary) =>
        summary[dataKey] !== undefined || summary.population !== undefined,
    )
    .sort((a, b) => a.year - b.year);
  return { summaries, crimeTypeKey: dataKey };
}

function getStateAbbrFromFips(fips: string): string | null {
  const stateMapping: Record<string, string> = {
    "01": "AL",
    "02": "AK",
    "04": "AZ",
    "05": "AR",
    "06": "CA",
    "08": "CO",
    "09": "CT",
    "10": "DE",
    "11": "DC",
    "12": "FL",
    "13": "GA",
    "15": "HI",
    "16": "ID",
    "17": "IL",
    "18": "IN",
    "19": "IA",
    "20": "KS",
    "21": "KY",
    "22": "LA",
    "23": "ME",
    "24": "MD",
    "25": "MA",
    "26": "MI",
    "27": "MN",
    "28": "MS",
    "29": "MO",
    "30": "MT",
    "31": "NE",
    "32": "NV",
    "33": "NH",
    "34": "NJ",
    "35": "NM",
    "36": "NY",
    "37": "NC",
    "38": "ND",
    "39": "OH",
    "40": "OK",
    "41": "OR",
    "42": "PA",
    "44": "RI",
    "45": "SC",
    "46": "SD",
    "47": "TN",
    "48": "TX",
    "49": "UT",
    "50": "VT",
    "51": "VA",
    "53": "WA",
    "54": "WV",
    "55": "WI",
    "56": "WY",
    "72": "PR",
  };
  return stateMapping[fips] || null;
}
