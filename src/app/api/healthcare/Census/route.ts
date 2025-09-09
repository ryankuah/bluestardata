// /api/census-healthcare/route.ts
import { NextRequest, NextResponse } from "next/server";

const CENSUS_API_URL = "https://api.census.gov/data/2022/cbp";

// Healthcare NAICS codes
const HEALTHCARE_NAICS = [
  "622", // Hospitals
  "6211", // Offices of physicians
  "6212", // Offices of dentists
  "6213", // Offices of other health practitioners
  "6214", // Outpatient care centers
  "6215", // Medical and diagnostic laboratories
  "6216", // Home health care services
  "00", // Total (for comparison)
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stateFips = searchParams.get("state");
  const countyFips = searchParams.get("county");

  if (!stateFips || !countyFips) {
    return NextResponse.json(
      { error: "Missing state or county parameter" },
      { status: 400 },
    );
  }

  try {
    // Fetch data for all healthcare NAICS codes
    const requests = HEALTHCARE_NAICS.map((naics) =>
      fetch(
        `${CENSUS_API_URL}?get=NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN&for=county:${countyFips}&in=state:${stateFips}&NAICS2017=${naics}`,
      )
        .then(async (res) => {
          const json = (await res.json()) as unknown;
          return Array.isArray(json) && Array.isArray(json[0])
            ? (json as string[][])
            : null;
        })
        .catch(() => null),
    );

    const responses = await Promise.all(requests);

    const healthcareData = responses
      .filter(
        (response): response is string[][] =>
          Boolean(response) && Array.isArray(response) && response.length > 1,
      )
      .map((response) => {
        const row = response[1]!; // Skip header row
        const industryCode = (row[0] ?? "").toString();
        const industryName = (row[1] ?? "").toString();
        const establishments = Number(row[2] ?? 0) || 0;
        const employees = Number(row[3] ?? 0) || 0;
        const annualPayroll = Number(row[4] ?? 0) || 0; // in thousands
        return {
          industryCode,
          industryName,
          establishments,
          employees,
          annualPayroll,
        };
      })
      .filter((item) => item.employees > 0); // Only include industries with employees

    return NextResponse.json(healthcareData);
  } catch (error) {
    console.error("Error fetching Census healthcare data:", error);
    return NextResponse.json(
      { error: "Failed to fetch healthcare employment data" },
      { status: 500 },
    );
  }
}
