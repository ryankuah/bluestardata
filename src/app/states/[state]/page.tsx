import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { states } from "@/server/db/schema";
import { promises as fs } from "fs";
import { type FeatureCollection, type GeoJSON, type Geometry } from "geojson";
import { bbox } from "@turf/bbox";
import { Map } from "./map";
import { env } from "@/env";
import { booleanWithin } from "@turf/boolean-within";

export default async function statePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const slug = (await params).state;
  const state = decodeURIComponent(slug);
  const stateDB = await db.query.states.findFirst({
    where: eq(states.name, state),
    with: {
      counties: true,
      msas: true,
    },
  });
  if (!stateDB) return <div>{state} not found</div>;
  const counties = stateDB.counties;
  const msas = stateDB.msas;

  const file = await fs.readFile("/public/states.json", "utf8");
  const data = JSON.parse(file) as FeatureCollection;
  const stateData = data.features.find(
    (feature) => feature.properties!.name === state,
  );
  if (!stateData) return <div>{state} not found</div>;
  const feature = {
    type: "FeatureCollection",
    features: [stateData],
  } as GeoJSON;

  const [minLng, minLat, maxLng, maxLat] = bbox(feature);

  const countyFile = await fs.readFile(
    process.cwd() + "/public/counties.geojson",
    "utf8",
  );
  const countyData = JSON.parse(countyFile) as FeatureCollection;

  return (
    <div className="flex flex-row">
      <Map
        token={env.MAPBOX_TOKEN}
        minLng={minLng}
        minLat={minLat}
        maxLng={maxLng}
        maxLat={maxLat}
        countyData={countyData}
        counties={counties}
        msas={msas}
        state={state}
      />
    </div>
  );
}