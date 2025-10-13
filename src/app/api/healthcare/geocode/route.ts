import { NextRequest, NextResponse } from "next/server";
import hospitalData from "@/lib/hospitals.json";

// Simple in-memory cache for geocoding results
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

// Rate limiting for Nominatim (1 request per second)
let lastGeocodingRequest = 0;
const GEOCODING_DELAY = 1100;

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address) ?? null;
  }

  try {
    const now = Date.now();
    const timeSinceLastRequest = now - lastGeocodingRequest;
    if (timeSinceLastRequest < GEOCODING_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, GEOCODING_DELAY - timeSinceLastRequest),
      );
    }
    lastGeocodingRequest = Date.now();

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=us`,
      {
        headers: {
          "User-Agent": "HealthcareMapApp/1.0",
        },
      },
    );

    if (!response.ok) {
      geocodeCache.set(address, null);
      return null;
    }

    const data = (await response.json()) as unknown;

    if (Array.isArray(data) && data.length > 0) {
      const coords = {
        lat: parseFloat(
          String((data as Array<{ lat: string; lon: string }>)[0]!.lat),
        ),
        lng: parseFloat(
          String((data as Array<{ lat: string; lon: string }>)[0]!.lon),
        ),
      };
      geocodeCache.set(address, coords);
      return coords;
    } else {
      geocodeCache.set(address, null);
      return null;
    }
  } catch (error) {
    console.error(`Error geocoding address ${address}:`, error);
    geocodeCache.set(address, null);
    return null;
  }
}

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

  const filteredHospitals = hospitalData.filter(
    (hospital) =>
      hospital.statefips === stateFips &&
      hospital.countyfips.toString() === countyFips,
  );

  console.log("🌍 Starting geocoding for hospitals...");
  const hospitalsWithCoords = [];

  for (const hospital of filteredHospitals) {
    if (hospital.address && hospital.city && hospital.state) {
      const fullAddress = `${hospital.address}, ${hospital.city}, ${hospital.state}`;
      const coords = await geocodeAddress(fullAddress);
      hospitalsWithCoords.push({
        ...hospital,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
    } else {
      hospitalsWithCoords.push({
        ...hospital,
        latitude: null,
        longitude: null,
      });
    }
  }

  console.log(`✅ Hospital geocoding complete!`);

  return NextResponse.json({
    hospitals: hospitalsWithCoords,
    hospitalCount: hospitalsWithCoords.length,
  });
}
