const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

type BLSRequestPayload = {
  seriesid: string[];
  registrationkey: string | undefined;
  startyear: string;
  endyear: string;
};

type BLSResponse = {
  Results?: {
    series?: {
      seriesID: string;
      data: { year: string; period: string; value: string }[];
    }[];
  };
  message?: string;
  status?: number;
};

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      seriesid?: string[];
      startyear?: string;
      endyear?: string;
    };

    const { seriesid, startyear, endyear } = body;

    if (!seriesid || !startyear || !endyear) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const payload: BLSRequestPayload = {
      seriesid,
      registrationkey: process.env.NEXT_PUBLIC_BLS_API_KEY,
      startyear,
      endyear,
    };

    const response = await fetch(BLS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch data from BLS API" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data: unknown = await response.json();

    if (isBLSResponse(data)) {
      if (!data.Results) {
        return new Response(
          JSON.stringify({
            error: data.message ?? "No results returned",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unexpected response structure" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching data from BLS API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function isBLSResponse(data: unknown): data is BLSResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    ("Results" in data || "message" in data)
  );
}
