import { NextResponse } from 'next/server';

const CENSUS_API_URL = "https://api.census.gov/data/2022/cbp";

type CensusRequestBody = {
  stateFips?: string;
  countyFips?: string;
};

type CensusResponse = string[][];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CensusRequestBody;

    const { stateFips, countyFips } = body;

    if (!stateFips || !countyFips) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const url = `${CENSUS_API_URL}?get=NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN&for=county:${countyFips}&in=state:${stateFips}&key=${process.env.NEXT_PUBLIC_CENSUS_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch data from Census API" }, { status: response.status });
    }

    try {
      const data: CensusResponse = (await response.json()) as CensusResponse;
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: "Error parsing data from Census API" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error fetching data from Census API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
