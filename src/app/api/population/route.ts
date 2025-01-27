import { NextRequest } from 'next/server';

const POPULATION_API_URL = "https://api.census.gov/data/";
const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

if (!CENSUS_API_KEY) {
  throw new Error("Census API Key is not set in the environment variables.");
}

// Separate function to construct URLs for each endpoint
function constructPopulationApiUrl(year: string, stateFips: string, countyFips?: string): string {
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

function constructDemographicsApiUrl(year: string, stateFips: string, countyFips?: string): string {
  let url = `${POPULATION_API_URL}${year}/pep/charagegroups?get=AGEGROUP,HISP,RACE,SEX,POP,STATE,COUNTY,GEO_ID,DATE_CODE,REGION,DIVISION&key=${CENSUS_API_KEY}`;
  
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

interface PopulationData {
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

interface DemographicData {
  ageGroup: string;
  hispanicOrigin: string;
  race: string;
  sex: string;
  pop: number;
  geoId: string;
  state: string;
  county: string;
  dateCode: string;
  region: string;
  division: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body: PostRequestBody = await req.json();
    const { stateFips, countyFips, year } = body;

    if (!stateFips) {
      return new Response(
        JSON.stringify({ error: "State FIPS code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!year) {
      return new Response(
        JSON.stringify({ error: "Year is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Make both API calls in parallel
    const [populationResponse, demographicsResponse] = await Promise.all([
      fetch(constructPopulationApiUrl(year.toString(), stateFips, countyFips)),
      fetch(constructDemographicsApiUrl(year.toString(), stateFips, countyFips))
    ]);

    if (!populationResponse.ok) {
      throw new Error(`Population API returned ${populationResponse.status}: ${await populationResponse.text()}`);
    }

    if (!demographicsResponse.ok) {
      throw new Error(`Demographics API returned ${demographicsResponse.status}: ${await demographicsResponse.text()}`);
    }

    const populationData = await populationResponse.json();
    const demographicsData = await demographicsResponse.json();

    // Transform population data (skip header row)
    const transformedPopData = populationData.slice(1).map((item: any) => ({
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

    // Transform demographics data (skip header row)
    const transformedDemographics = demographicsData.slice(1).map((item: any) => ({
      ageGroup: item[0],
      hispanicOrigin: item[1],
      race: item[2],
      sex: item[3],
      pop: parseInt(item[4], 10),
      state: item[5],
      county: item[6],
      geoId: item[7],
      dateCode: item[8],
      region: item[9],
      division: item[10],
    }));

    // Group demographics by geoId
    const demographicsByGeoId: Record<string, DemographicData[]> = transformedDemographics.reduce((acc: Record<string, DemographicData[]>, curr: DemographicData) => {
      if (!acc[curr.geoId]) {
        acc[curr.geoId] = [];
      }
      if (acc[curr.geoId]) {
        acc[curr.geoId].push(curr);
      }
      return acc;
    }, {});

    // Combine population and demographic data
    const combinedData: Array<PopulationData & { demographics: DemographicData[] }> = transformedPopData.map((popItem: PopulationData) => ({
      ...popItem,
      demographics: demographicsByGeoId[popItem.geoId] || []
    }));

    return new Response(
      JSON.stringify(combinedData),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Internal Server Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}