// /api/bls-healthcare/route.ts
import { type NextRequest, NextResponse } from "next/server";

const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

interface BLSDataPoint {
  year: string;
  period: string;
  value: string;
  footnotes?: Array<
    { code?: string; text?: string | null } | Record<string, never>
  >;
}

interface BLSSeries {
  seriesID: string;
  data: BLSDataPoint[];
}

interface BLSResponse {
  Results?: {
    series?: BLSSeries[];
  };
}

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

  const areaCode = stateFips + countyFips;

  // Healthcare industry codes for BLS QCEW
  const healthcareIndustryCodes = [
    "622", // Hospitals
    "6211", // Offices of physicians
    "6212", // Offices of dentists
    "6213", // Offices of other health practitioners
    "6214", // Outpatient care centers
    "6215", // Medical and diagnostic laboratories
    "6216", // Home health care services
  ];

  // BLS series construction: ENU + area + datatype + size + ownership + industry
  // datatype: 1=employees, 3=total wages, 5=average annual pay
  const dataTypes = ["1", "3", "5"]; // employees, wages, avg pay
  const size = "0"; // all sizes
  const ownership = "5"; // total covered

  const seriesIds = healthcareIndustryCodes.flatMap((industry) =>
    dataTypes.map(
      (dataType) => `ENU${areaCode}${dataType}${size}${ownership}${industry}`,
    ),
  );

  try {
    const payload = {
      seriesid: seriesIds,
      registrationkey: process.env.NEXT_PUBLIC_BLS_API_KEY,
      startyear: "2019",
      endyear: "2023",
    };

    const response = await fetch(BLS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch BLS data");
    }

    const data: BLSResponse = (await response.json()) as BLSResponse;

    if (!data.Results?.series?.length) {
      return NextResponse.json({ series: [] });
    }

    // Process and return the time series data
    const processedData = (data.Results.series ?? []).map((series) => ({
      seriesID: series.seriesID,
      data: series.data ?? [],
    }));

    return NextResponse.json({ series: processedData });
  } catch (error) {
    console.error("Error fetching BLS healthcare data:", error);
    return NextResponse.json(
      { error: "Failed to fetch BLS healthcare data" },
      { status: 500 },
    );
  }
}
