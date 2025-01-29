import { env } from "@/env.js";
import { db } from "@/server/db";
import { type GeoJSON, type Feature, type AllCounties } from "./types";

export async function getStateGeoJSON() {
    const features = (await db.query.states.findMany({
      columns: {
        border: true,
        name: true,
        abbreviation: true,
        fipsCode: true,
      },
    })) as unknown as {
      border: {
        type: string;
        geometry: { type: string; coordinates: [[number, number][]] };
      };
      name: string;
      abbreviation: string;
      fipsCode: number;
    }[];
  
    const geoJSON: GeoJSON = {
      type: "FeatureCollection",
      features: features.map((feature) => ({
        type: "Feature",
        id: feature.abbreviation,
        properties: {
          name: feature.name,
          percentile:
            Math.abs(
              feature.name
                .split("")
                .reduce(
                  (hash, char) => (hash << 5) - hash + char.charCodeAt(0),
                  0,
                ),
            ) % 9,
          fipsCode: feature.fipsCode,
        },
        geometry: feature.border.geometry,
      })) as unknown as Feature[],
    };
    return geoJSON;
  }
  
  export async function getToken() {
    return env.MAPBOX_TOKEN;
  }
  
  export async function getAllCountyData() {
    const allStates = await db.query.states.findMany({
      with: {
        counties: true,
      },
    });
    return allStates as unknown as AllCounties[];
  }