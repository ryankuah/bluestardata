import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { states } from "@/server/db/schema";
import { bbox } from "@turf/bbox";
import { Map } from "./map";
import { env } from "@/env";
import {
  type Feature,
  type County,
  type GeoJSON,
  type Geometry,
} from "@/utils";
import { type FeatureCollection } from "geojson";

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
  const stateCounties = stateDB.counties as County[];
  const stateMsas = stateDB.msas;

  const stateData = stateDB.stateBorder as Feature;
  if (!stateData) return <div>{state} not found</div>;
  const feature = {
    type: "FeatureCollection",
    features: [stateData],
  } as FeatureCollection;

  const [minLng, minLat, maxLng, maxLat] = bbox(feature);

  const filteredCounties = stateCounties.filter(
    (item) => item.countyBorder !== null,
  );

  const countyData = {
    type: "FeatureCollection",
    features: filteredCounties.map((county) => ({
      type: "Feature",
      properties: {
        name: county.countyBorder.properties.NAME,
      },
      geometry: county.countyBorder.geometry as Geometry,
    })),
  } as unknown as GeoJSON;

  return (
    <div className="flex flex-row">
      <Map
        token={env.MAPBOX_TOKEN}
        minLng={minLng}
        minLat={minLat}
        maxLng={maxLng}
        maxLat={maxLat}
        countyData={countyData}
        counties={stateCounties}
        msas={stateMsas}
        state={state}
      />
    </div>
  );
}
