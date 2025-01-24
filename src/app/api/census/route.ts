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
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = `${CENSUS_API_URL}?get=NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN&for=county:${countyFips}&in=state:${stateFips}&key=${process.env.NEXT_PUBLIC_CENSUS_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch data from Census API" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data: CensusResponse = (await response.json()) as CensusResponse;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching data from Census API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
