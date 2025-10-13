import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { censusHealthcareData } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

const CENSUS_API_URL = "https://api.census.gov/data/2022/cbp";
const CACHE_DURATION_DAYS = 365; // Census data doesn't change often

const HEALTHCARE_NAICS = [
  "622",
  "6211",
  "6212",
  "6213",
  "6214",
  "6215",
  "6216",
  "00",
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

  // CHECK DATABASE FIRST
  const cached = await db
    .select()
    .from(censusHealthcareData)
    .where(
      and(
        eq(censusHealthcareData.stateFips, stateFips),
        eq(censusHealthcareData.countyFips, countyFips.padStart(3, "0")),
      ),
    );

  // Check if cache is still fresh
  if (cached.length > 0) {
    const fetchedAt = cached[0]!.fetchedAt;
    const daysSinceFetch = fetchedAt
      ? (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceFetch < CACHE_DURATION_DAYS) {
      console.log(
        `✅ Using cached Census data (${Math.floor(daysSinceFetch)} days old)`,
      );

      return NextResponse.json(
        cached.map((row) => ({
          industryCode: row.industryCode,
          industryName: row.industryName,
          establishments: row.establishments,
          employees: row.employees,
          annualPayroll: row.annualPayroll,
        })),
      );
    }
  }

  // NOT CACHED OR STALE - Fetch from API
  console.log("❌ No fresh Census data. Fetching from API...");

  try {
    const requests = HEALTHCARE_NAICS.map((naics) =>
      fetch(
        `${CENSUS_API_URL}?get=NAICS2017,NAICS2017_LABEL,ESTAB,EMP,PAYANN&for=county:${countyFips}&in=state:${stateFips}&NAICS2017=${naics}`,
      )
        .then(async (res) => {
          const json = await res.json();
          return Array.isArray(json) && Array.isArray(json[0]) ? json : null;
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
        const row = response[1]!;
        return {
          industryCode: row[0]?.toString() || "",
          industryName: row[1]?.toString() || "",
          establishments: Number(row[2]) || 0,
          employees: Number(row[3]) || 0,
          annualPayroll: Number(row[4]) || 0,
        };
      })
      .filter((item) => item.employees > 0);

    // STORE IN DATABASE
    if (healthcareData.length > 0) {
      // Delete old data for this county
      await db
        .delete(censusHealthcareData)
        .where(
          and(
            eq(censusHealthcareData.stateFips, stateFips),
            eq(censusHealthcareData.countyFips, countyFips.padStart(3, "0")),
          ),
        );

      // Insert new data
      await db.insert(censusHealthcareData).values(
        healthcareData.map((item) => ({
          stateFips,
          countyFips: countyFips.padStart(3, "0"),
          ...item,
        })),
      );

      console.log(
        `💾 Stored ${healthcareData.length} Census records in database`,
      );
    }

    return NextResponse.json(healthcareData);
  } catch (error) {
    console.error("Error fetching Census healthcare data:", error);
    return NextResponse.json(
      { error: "Failed to fetch healthcare employment data" },
      { status: 500 },
    );
  }
}
