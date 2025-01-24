import { db } from "@/server/db";
import { counties, states } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import CountyMap from "./map";
import { type Feature } from "geojson";
import FRED from "@/components/fred/fred";
import Unemployment from "./unemployment";
import Labour from "./employment";
import { Suspense } from "react";

export default async function page({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}) {
  const stateSlug = (await params).state;
  const countySlug = (await params).county;
  const state = decodeURIComponent(stateSlug);
  const county = decodeURIComponent(countySlug);
  const stateCounties = await db.query.states.findFirst({
    where: eq(states.name, state),
    with: {
      counties: true,
    },
  });
  const countyObj = stateCounties!.counties.find(
    (place) => place.name === county,
  );
  const countyBorder = countyObj!.countyBorder as Feature;

  return (
    <div className="flex h-screen w-screen flex-col p-4">
      <h1 className="text-2xl font-bold">
        {county}, {state}
      </h1>
      <div className="flex h-max w-[100vw] flex-row gap-2">
        <CountyMap feature={countyBorder} token={env.MAPBOX_TOKEN} />
        <div className="flex h-full w-full flex-col">
          <p>Population:</p>
          <p>Median Age:</p>
          <p>Median Income:</p>
          <p>Poverty Rate:</p>
          <p>Unemployment Rate:</p>
        </div>
      </div>
      <div className="z-50 flex h-full w-[100vw] flex-col bg-white p-2">
        <div className="z-50 mx-auto flex h-[60vh] w-[80vw] flex-col items-center justify-center bg-white p-2">
          <Unemployment
            state={state}
            county={county}
            stateFips={stateCounties!.fipsCode!.toString().padStart(2, "0")}
            countyFips={countyObj!.fipsCode!.toString().padStart(3, "0")}
          />
        </div>
      </div>
      <div className="flex h-full w-full flex-col bg-white p-2">
        <Labour
          state={state}
          county={county}
          stateFips={stateCounties!.fipsCode!.toString().padStart(2, "0")}
          countyFips={countyObj!.fipsCode!.toString().padStart(3, "0")}
        />
      </div>
    </div>
  );
}
// <FRED state={state} county={county} />
