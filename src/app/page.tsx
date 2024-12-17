import { db } from "@/server/db";
import Link from "next/link";
import { env } from "@/env";
import { StateMap } from "./map";
import { type FeatureCollection as GeoJSON } from "geojson";
import { promises as fs } from "fs";
import file from "./states.json";

export default async function USAPage() {
  const data = file as GeoJSON;

  return (
    <div>
      <StateMap token={env.MAPBOX_TOKEN} data={data} />
    </div>
  );
}
