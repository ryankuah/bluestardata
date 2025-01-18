import { db } from "@/server/db";
import { counties, states } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import CountyMap from "./map";
import { type Feature } from "geojson";
import Unemployment from "./unemployment";
import Labour from "./employment";
import CensusCBP from "@/components/census/cbp";

export default async function Page({
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
    (place) => place.name === county
  );
  const countyBorder = countyObj!.countyBorder as Feature;

  return (
    <div className="flex flex-col items-center w-screen bg-gray-50 p-6 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-800">
          {county}, {state}
        </h1>
      </header>

      <section className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl bg-white shadow-md rounded-lg p-4">
        <div className="flex-1 h-80 overflow-hidden rounded-lg">
          <CountyMap
            feature={countyBorder}
            token={env.MAPBOX_TOKEN}
          />
        </div>
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Basic Statistics</h2>
          <p className="text-gray-600">Population: TBD</p>
          <p className="text-gray-600">Median Age: TBD</p>
          <p className="text-gray-600">Median Income: TBD</p>
          <p className="text-gray-600">Poverty Rate: TBD</p>
          <p className="text-gray-600">Unemployment Rate: TBD</p>
        </div>
      </section>


      <section className="w-full max-w-6xl bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold text-gray-700">Unemployment Data</h2>
        <Unemployment
          state={state}
          county={county}
          stateFips={stateCounties!.fipsCode!.toString().padStart(2, "0")}
          countyFips={countyObj!.fipsCode!.toString().padStart(3, "0")}
        />
      </section>

      <section className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white shadow-md rounded-lg p-4">
          <Labour
            state={state}
            county={county}
            stateFips={stateCounties!.fipsCode!.toString().padStart(2, "0")}
            countyFips={countyObj!.fipsCode!.toString().padStart(3, "0")}
          />
        </div>
      </section>

      <section className="w-full max-w-6xl bg-white shadow-md rounded-lg p-4">
        <h2 className="text-xl font-semibold text-gray-700">Census CBP Data</h2>
        <CensusCBP
          state={state}
          county={county}
          stateFips={stateCounties!.fipsCode!.toString().padStart(2, "0")}
          countyFips={countyObj!.fipsCode!.toString().padStart(3, "0")}
        />
      </section>
    </div>
  );
}
