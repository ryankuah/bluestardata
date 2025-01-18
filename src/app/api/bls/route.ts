const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

export async function POST(req: Request) {
  try {
    const { seriesid, startyear, endyear } = await req.json();

    if (!seriesid || !startyear || !endyear) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = {
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
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching data from BLS API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
