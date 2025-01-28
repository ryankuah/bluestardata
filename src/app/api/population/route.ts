import { NextRequest } from "next/server";

const POPULATION_API_URL = "https://api.census.gov/data/";
const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

if (!CENSUS_API_KEY) {
  throw new Error("Census API Key is not set in the environment variables.");
}

interface PopulationApiUrlParams {
  year: string;
  stateFips: string;
  countyFips?: string;
}

interface CharAgeGroupsApiUrlParams {
  year: string;
  stateFips: string;
  countyFips?: string;
}

function constructPopulationApiUrl({
  year,
  stateFips,
  countyFips,
}: PopulationApiUrlParams): string {
  let url = `${POPULATION_API_URL}${year}/pep/population?get=DENSITY,REGION,STATE,COUNTY,GEO_ID,FUNCSTAT,POP,LASTUPDATE,DIVISION,PRIMGEOFLAG,DATE_CODE&key=${CENSUS_API_KEY}`;

  if (stateFips && countyFips) {
    url += `&for=county:${countyFips}&in=state:${stateFips}`;
  } else if (stateFips) {
    url += `&for=county:*&in=state:${stateFips}`;
  } else {
    url += `&for=county:*`;
  }

  return url;
}

function constructCharAgeGroupsApiUrl({
  year,
  stateFips,
  countyFips,
}: CharAgeGroupsApiUrlParams): string {
  let url = `${POPULATION_API_URL}${year}/pep/charagegroups?get=AGEGROUP,POP,SEX,RACE,HISP,STATE,COUNTY,DATE_CODE&key=${CENSUS_API_KEY}`;

  if (stateFips && countyFips) {
    url += `&for=county:${countyFips}&in=state:${stateFips}`;
  } else if (stateFips) {
    url += `&for=county:*&in=state:${stateFips}`;
  } else {
    url += `&for=county:*`;
  }

  return url;
}

interface PostRequestBody {
  stateFips: string;
  countyFips?: string;
  year: number;
}

interface CensusApiResponseItem {
  density: number;
  region: string;
  state: string;
  county: string;
  geoId: string;
  funcStat: string;
  pop: number;
  lastUpdate: string;
  division: string;
  primGeoFlag: string;
  dateCode: string;
}

interface CharAgeGroupsApiResponseItem {
  ageGroup: string;
  pop: number;
  sex: string;
  race: string;
  hisp: string;
  state: string;
  county: string;
  dateCode: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body: PostRequestBody = await req.json();
    const { stateFips, countyFips, year } = body;

    if (!stateFips) {
      return new Response(
        JSON.stringify({ error: "State FIPS code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!year) {
      return new Response(JSON.stringify({ error: "Year is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch population data
    const populationUrl = constructPopulationApiUrl({
      year: year.toString(),
      stateFips,
      countyFips,
    });

    const populationResponse = await fetch(populationUrl);
    if (!populationResponse.ok) {
      throw new Error(
        `Census API (Population) returned ${populationResponse.status}: ${await populationResponse.text()}`,
      );
    }

    const populationRawData = await populationResponse.json();
    const populationData = populationRawData.slice(1).map((item: any) => ({
      density: parseFloat(item[0]),
      region: item[1],
      state: item[2],
      county: item[3],
      geoId: item[4],
      funcStat: item[5],
      pop: parseInt(item[6], 10),
      lastUpdate: item[7],
      division: item[8],
      primGeoFlag: item[9],
      dateCode: item[10],
    }));

    // Fetch charagegroups data
    const charAgeGroupsUrl = constructCharAgeGroupsApiUrl({
      year: year.toString(),
      stateFips,
      countyFips,
    });

    const charAgeGroupsResponse = await fetch(charAgeGroupsUrl);
    if (!charAgeGroupsResponse.ok) {
      throw new Error(
        `Census API (CharAgeGroups) returned ${charAgeGroupsResponse.status}: ${await charAgeGroupsResponse.text()}`,
      );
    }

    const charAgeGroupsRawData = await charAgeGroupsResponse.json();
    const charAgeGroupsData = charAgeGroupsRawData
      .slice(1)
      .map((item: any) => ({
        ageGroup: item[0],
        pop: parseInt(item[1], 10),
        sex: item[2],
        race: item[3],
        hisp: item[4],
        state: item[5],
        county: item[6],
        dateCode: item[7],
      }));

    // Combine both responses into a single object
    const responseData = {
      population: populationData,
      charAgeGroups: charAgeGroupsData,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
