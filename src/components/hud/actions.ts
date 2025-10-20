"use server";

import { env } from "@/env";
import { db } from "@/server/db";
import { hudData } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";

type HUDData = {
  fmr: {
    year: number;
    data: {
      efficiency: number;
      oneBedroom: number;
      twoBedroom: number;
      threeBedroom: number;
      fourBedroom: number;
    };
  }[];
  il: {
    year: number;
    data: {
      onePerson: number;
      twoPerson: number;
      threePerson: number;
      fourPerson: number;
    };
  }[];
  mstp: {
    year: number;
    data: {
      oneBedroom: number;
      twoBedroom: number;
      threeBedroom: number;
      fourBedroom: number;
    };
  }[];
};

type HUDApiResponse = {
  data?: {
    basicdata?: Record<string, unknown>;
    low?: Record<string, unknown>;
    "60percent"?: Record<string, unknown>;
  };
} | null;

// Renamed from fetchHUDData to fetchHUDDataFromAPI
async function fetchHUDDataFromAPI(
  stateFips: string,
  countyFips: string,
): Promise<HUDData> {
  const baseUrl = "https://www.huduser.gov/hudapi/public";
  const headers = {
    Authorization: `Bearer ${env.HUD_API_TOKEN}`,
  };

  const entityId = `${stateFips}${countyFips}99999`;
  const currentYear = new Date().getFullYear();

  const safeParseNumber = (val: unknown): number =>
    isNaN(Number(val)) ? 0 : Number(val);

  const fmrPromises = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return fetch(`${baseUrl}/fmr/data/${entityId}?year=${year}`, { headers })
      .then((res) => res.json() as Promise<HUDApiResponse>)
      .catch(() => null);
  });

  const fmrResults = await Promise.all(fmrPromises);
  const fmrData = fmrResults.reverse().map((result, i) => ({
    year: currentYear - 4 + i,
    data: {
      efficiency: safeParseNumber(result?.data?.basicdata?.Efficiency),
      oneBedroom: safeParseNumber(result?.data?.basicdata?.["One-Bedroom"]),
      twoBedroom: safeParseNumber(result?.data?.basicdata?.["Two-Bedroom"]),
      threeBedroom: safeParseNumber(result?.data?.basicdata?.["Three-Bedroom"]),
      fourBedroom: safeParseNumber(result?.data?.basicdata?.["Four-Bedroom"]),
    },
  }));

  const ilPromises = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return fetch(`${baseUrl}/il/data/${entityId}?year=${year}`, { headers })
      .then((res) => res.json() as Promise<HUDApiResponse>)
      .catch(() => null);
  });

  const ilResults = await Promise.all(ilPromises);
  const ilData = ilResults.reverse().map((result, i) => ({
    year: currentYear - 4 + i,
    data: {
      onePerson: safeParseNumber(result?.data?.low?.il80_p1),
      twoPerson: safeParseNumber(result?.data?.low?.il80_p2),
      threePerson: safeParseNumber(result?.data?.low?.il80_p3),
      fourPerson: safeParseNumber(result?.data?.low?.il80_p4),
    },
  }));

  const mstpPromises = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return fetch(`${baseUrl}/mtspil/data/${entityId}?year=${year}`, { headers })
      .then((res) => res.json() as Promise<HUDApiResponse>)
      .catch(() => null);
  });

  const mstpResults = await Promise.all(mstpPromises);
  const mstpData = mstpResults.reverse().map((result, i) => ({
    year: currentYear - 4 + i,
    data: {
      oneBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p2),
      twoBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p3),
      threeBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p4),
      fourBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p5),
    },
  }));

  return {
    fmr: fmrData,
    il: ilData,
    mstp: mstpData,
  };
}

// NEW: Wrapper function with caching
export async function fetchHUDData(
  stateFips: string,
  countyFips: string,
): Promise<HUDData> {
  // Check cache
  const cached = await db.query.hudData.findFirst({
    where: and(
      eq(hudData.stateFips, stateFips),
      eq(hudData.countyFips, countyFips),
    ),
  });

  if (cached) {
    return cached.hudData as HUDData;
  }

  // Cache miss - fetch from API
  const freshData = await fetchHUDDataFromAPI(stateFips, countyFips);

  // Store in database
  await db.insert(hudData).values({
    stateFips,
    countyFips,
    hudData: freshData,
  });

  return freshData;
}
