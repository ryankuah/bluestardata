import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { blsHealthcareData } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const CACHE_DURATION_DAYS = 90; // BLS updates quarterly

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

  // CHECK DATABASE FIRST
  const cached = await db
    .select()
    .from(blsHealthcareData)
    .where(
      and(
        eq(blsHealthcareData.stateFips, stateFips),
        eq(blsHealthcareData.countyFips, countyFips.padStart(3, "0")),
      ),
    );

  if (cached.length > 0) {
    const fetchedAt = cached[0]!.fetchedAt;
    const daysSinceFetch = fetchedAt
      ? (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceFetch < CACHE_DURATION_DAYS) {
      console.log(
        `✅ Using cached BLS data (${Math.floor(daysSinceFetch)} days old)`,
      );

      return NextResponse.json({
        series: cached.map((row) => ({
          seriesID: row.seriesId,
          data: row.dataPoints,
        })),
      });
    }
  }

  // NOT CACHED - Fetch from API
  console.log("❌ No fresh BLS data. Fetching from API...");

  const areaCode = stateFips + countyFips;
  const healthcareIndustryCodes = [
    "622",
    "6211",
    "6212",
    "6213",
    "6214",
    "6215",
    "6216",
  ];

  const dataTypes = ["1", "3", "5"];
  const size = "0";
  const ownership = "5";

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

    const data = await response.json();

    if (!data.Results?.series?.length) {
      return NextResponse.json({ series: [] });
    }

    const processedData = data.Results.series.map((series: any) => ({
      seriesID: series.seriesID,
      data: series.data ?? [],
    }));

    // STORE IN DATABASE
    if (processedData.length > 0) {
      // Delete old data
      await db
        .delete(blsHealthcareData)
        .where(
          and(
            eq(blsHealthcareData.stateFips, stateFips),
            eq(blsHealthcareData.countyFips, countyFips.padStart(3, "0")),
          ),
        );

      // Insert new data
      await db.insert(blsHealthcareData).values(
        processedData.map((item: any) => ({
          stateFips,
          countyFips: countyFips.padStart(3, "0"),
          seriesId: item.seriesID,
          dataPoints: item.data,
        })),
      );

      console.log(`💾 Stored ${processedData.length} BLS series in database`);
    }

    return NextResponse.json({ series: processedData });
  } catch (error) {
    console.error("Error fetching BLS healthcare data:", error);
    return NextResponse.json(
      { error: "Failed to fetch BLS healthcare data" },
      { status: 500 },
    );
  }
}
