// src/components/bls/HealthcareBLS.tsx
import HealthcareOEWS from "./HealthcareOEWS";

const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

export type HealthcareDataSummary = {
  occupationTitle: string;
  employment: number;
  meanWage: number;
};

type BLSResponse = {
  Results?: {
    series?: {
      seriesID: string;
      data?: { year: string; period: string; value: string }[];
    }[];
  };
};

// Simple healthcare occupation codes - using 6-digit format that matches BLS
const healthcareOccupations = [
  {
    code: "290000",
    title: "Healthcare Practitioners and Technical Occupations",
  },
  { code: "291141", title: "Registered Nurses" },
  { code: "291069", title: "Physicians and Surgeons, All Other" },
  { code: "291171", title: "Nurse Practitioners" },
  {
    code: "292061",
    title: "Licensed Practical and Licensed Vocational Nurses",
  },
  { code: "310000", title: "Healthcare Support Occupations" },
  { code: "311131", title: "Nursing Assistants" },
];

export async function fetchHealthcareData(
  stateFips: string,
  countyFips: string,
): Promise<HealthcareDataSummary[]> {
  // Use state-level OEWS data instead of metro area
  const stateCode = `S${stateFips}0000`;

  // Build series IDs for OEWS data (employment and wages)
  const seriesIds = healthcareOccupations.flatMap((occupation) => [
    `OEUS${stateCode}${occupation.code}01`, // Employment
    `OEUS${stateCode}${occupation.code}04`, // Mean wage
  ]);

  console.log(
    "Fetching healthcare data with series IDs:",
    seriesIds.slice(0, 4),
  ); // Log first few IDs

  const payload = {
    seriesid: seriesIds,
    registrationkey: process.env.NEXT_PUBLIC_BLS_API_KEY,
    startyear: "2022",
    endyear: "2023",
  };

  const response = await fetch(BLS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data from BLS API");
  }

  const json = (await response.json()) as BLSResponse;
  console.log(
    "BLS API response status:",
    json.Results?.series?.length || 0,
    "series returned",
  );

  if (!json.Results?.series?.length) {
    return [];
  }

  const dataMap = new Map<string, Partial<HealthcareDataSummary>>();

  for (const series of json.Results.series) {
    if (!series.seriesID || !series.data) {
      console.log("Skipping series - no ID or data:", series.seriesID);
      continue;
    }

    console.log("Processing series:", series.seriesID);
    console.log("Series data length:", series.data.length);

    // If no data, skip
    if (series.data.length === 0) {
      console.log("Skipping - no data in series");
      continue;
    }

    // Extract occupation code and data type from series ID for state-level data
    // Format: OEUS{state}{occupation}{datatype}
    const match = /OEUS\w{6}(\w{6})(\d{2})/.exec(series.seriesID);
    if (!match) {
      console.log("No regex match for series:", series.seriesID);
      continue;
    }

    const occupationCodeRaw = match[1];
    const dataType = match[2];
    console.log(
      "Extracted occupation code:",
      occupationCodeRaw,
      "data type:",
      dataType,
    );

    // Convert occupation code format (remove leading zero if present)
    const cleanOccupationCode = occupationCodeRaw.replace(/^0/, "");

    const occupation = healthcareOccupations.find(
      (o) => o.code === occupationCodeRaw || o.code === cleanOccupationCode,
    );
    if (!occupation) {
      console.log(
        "No occupation found for code:",
        occupationCodeRaw,
        "or cleaned:",
        cleanOccupationCode,
      );
      console.log(
        "Available codes:",
        healthcareOccupations.map((o) => o.code),
      );
      continue;
    }

    // Since we have no M13 data, let's try any available data
    const latestData = series.data[0]; // Use first available data point
    if (!latestData || latestData.value === "-") {
      console.log("No valid data found for series:", series.seriesID);
      console.log("First data point:", latestData);
      continue;
    }

    console.log("Found data for", occupation.title, ":", latestData.value);

    const value = parseFloat(latestData.value.replace(/,/g, ""));
    if (isNaN(value)) continue;

    const key = occupation.code;
    if (!dataMap.has(key)) {
      dataMap.set(key, {
        occupationTitle: occupation.title,
      });
    }

    const entry = dataMap.get(key)!;

    if (dataType === "01") {
      // Employment
      entry.employment = value;
    } else if (dataType === "04") {
      // Mean wage
      entry.meanWage = value;
    }
  }

  console.log("Processed healthcare data entries:", dataMap.size);

  return Array.from(dataMap.values())
    .filter(
      (item): item is HealthcareDataSummary =>
        typeof item.employment === "number" &&
        typeof item.meanWage === "number" &&
        item.employment > 0 &&
        item.meanWage > 0,
    )
    .sort((a, b) => b.employment - a.employment);
}

export default async function HealthcareBLS({
  _state,
  _county,
  stateFips,
  countyFips,
}: {
  _state: string;
  _county: string;
  stateFips: string;
  countyFips: string;
}) {
  try {
    const healthcareData = await fetchHealthcareData(stateFips, countyFips);
    return (
      <HealthcareOEWS data={healthcareData} state={_state} county={_county} />
    );
  } catch (error) {
    console.error("Error fetching healthcare data:", error);
    return (
      <div className="text-center text-red-500">
        Failed to load healthcare data
      </div>
    );
  }
}
