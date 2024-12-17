import { db } from "@/server/db";
import Link from "next/link";
import { env } from "@/env";
import { StateMap } from "./map";
import { type FeatureCollection as GeoJSON } from "geojson";
import { promises as fs } from "fs";

export default async function USAPage() {
  const file = await fs.readFile(process.cwd() + "/public/states.json", "utf8");
  const data = JSON.parse(file) as GeoJSON;

  return (
    <div>
      <StateMap token={env.MAPBOX_TOKEN} data={data} />
    </div>
  );
}
