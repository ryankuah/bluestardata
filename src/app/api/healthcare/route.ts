import { NextRequest, NextResponse } from "next/server";
import zipCountyMap from "@/lib/zipCountyMap.json";
import hospitalData from "@/lib/hospitals.json";

// State FIPS to abbreviation mapping
const stateFipsToAbbr: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "72": "PR",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stateFips = searchParams.get("state");
  const countyFips = searchParams.get("county");

  if (!stateFips || !countyFips) {
    return NextResponse.json(
      { error: "Missing state or county query parameter." },
      { status: 400 },
    );
  }

  const stateAbbr = stateFipsToAbbr[stateFips] ?? stateFips;

  console.log(
    "🔍 Received request for state:",
    stateAbbr,
    "county FIPS:",
    countyFips,
  );

  // Filter hospitals by state and county
  const filteredHospitals = hospitalData.filter(
    (hospital) =>
      hospital.statefips === stateFips &&
      hospital.countyfips.toString() === countyFips,
  );

  console.log(
    `🏥 Found ${filteredHospitals.length} hospitals for this county.`,
  );

  const matchedZips = zipCountyMap
    .filter(
      (entry) =>
        entry.state.toUpperCase() === stateAbbr.toUpperCase() &&
        entry.county === countyFips,
    )
    .map((entry) => entry.zip);

  if (matchedZips.length === 0) {
    console.warn(
      `⚠️ No ZIP codes found for state=${stateAbbr} and county=${countyFips}`,
    );
    return NextResponse.json(
      {
        error: "No ZIP codes found for this county/state",
        hospitals: filteredHospitals,
        hospitalCount: filteredHospitals.length,
      },
      { status: 404 },
    );
  }

  console.log(`🔧 Found ${matchedZips.length} ZIP codes:`, matchedZips);

  try {
    const cmsRequests = matchedZips.map((zip) =>
      fetch(
        `https://npiregistry.cms.hhs.gov/api/?version=2.1&state=${stateAbbr}&postal_code=${zip}&enumeration_type=NPI-2&limit=50`,
      ).then((res) => res.json()),
    );

    const cmsResults = await Promise.all(cmsRequests);

    const allProviders = cmsResults
      .flatMap((result) => result.results || [])
      .filter(
        (provider, index, self) =>
          index === self.findIndex((p) => p.number === provider.number),
      )
      .map((provider) => {
        const addressParts = [
          provider.addresses?.find(
            (addr: {
              address_purpose?: string;
              address_1?: string;
              city?: string;
              state?: string;
              postal_code?: string;
            }) => addr.address_purpose === "LOCATION",
          )?.address_1,
          provider.addresses?.find(
            (addr: {
              address_purpose?: string;
              address_1?: string;
              city?: string;
              state?: string;
              postal_code?: string;
            }) => addr.address_purpose === "LOCATION",
          )?.city,
          provider.addresses?.find(
            (addr: {
              address_purpose?: string;
              address_1?: string;
              city?: string;
              state?: string;
              postal_code?: string;
            }) => addr.address_purpose === "LOCATION",
          )?.state,
          provider.addresses?.find(
            (addr: {
              address_purpose?: string;
              address_1?: string;
              city?: string;
              state?: string;
              postal_code?: string;
            }) => addr.address_purpose === "LOCATION",
          )?.postal_code,
        ].filter(Boolean);

        return {
          number: provider.number,
          name: provider.basic.organization_name,
          address: addressParts.join(", ") || "N/A",
          primaryTaxonomy:
            provider.taxonomies?.find((t: any) => t.primary)?.desc ?? "N/A",
          otherTaxonomies:
            provider.taxonomies?.map((t: any) => t.desc).join(", ") ?? "N/A",
        };
      });

    console.log(`✅ Found ${allProviders.length} unique providers.`);

    return NextResponse.json({
      providers: allProviders,
      providerCount: allProviders.length,
      hospitals: filteredHospitals,
      hospitalCount: filteredHospitals.length,
      total: allProviders.length + filteredHospitals.length,
    });
  } catch (error) {
    console.error("❌ CMS API fetch failed:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch from CMS NPI API",
        hospitals: filteredHospitals,
        hospitalCount: filteredHospitals.length,
      },
      { status: 500 },
    );
  }
}
